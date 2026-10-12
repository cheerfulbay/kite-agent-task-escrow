// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/**
 * @title KiteAgentTaskEscrow
 * @author cheerfulbay
 * @notice Multi-agent task bounty marketplace & milestone escrow vault on Kite Chain (EIP-155: 2368 / 2366).
 *         Supports decentralized micro-task funding, agent claims, and x402 payment authorization releases.
 */
contract KiteAgentTaskEscrow {
    enum TaskStatus {
        Created,
        Assigned,
        Submitted,
        Completed,
        Refunded
    }

    struct Task {
        bytes32 taskHash;
        address employer;
        address assignedAgent;
        uint256 bountyAmount;
        uint256 createdAt;
        uint256 deadline;
        TaskStatus status;
        bytes32 x402ReceiptHash;
    }

    uint256 public immutable chainId;
    address public owner;

    mapping(bytes32 => Task) public tasks;

    event TaskCreated(bytes32 indexed taskId, bytes32 indexed taskHash, address indexed employer, uint256 bounty, uint256 deadline);
    event TaskAssigned(bytes32 indexed taskId, address indexed agent);
    event TaskSubmitted(bytes32 indexed taskId, bytes32 deliverableHash);
    event TaskCompleted(bytes32 indexed taskId, address indexed agent, uint256 bounty, bytes32 x402ReceiptHash);
    event TaskRefunded(bytes32 indexed taskId, address indexed employer, uint256 refundAmount);

    error TaskExists(bytes32 taskId);
    error InvalidTaskState(bytes32 taskId, TaskStatus current);
    error Unauthorized();
    error DeadlineExceeded();
    error DeadlineNotReached();
    error ZeroBounty();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        chainId = block.chainid;
    }

    function createTask(
        bytes32 taskHash,
        uint256 durationSeconds
    ) external payable returns (bytes32 taskId) {
        if (msg.value == 0) revert ZeroBounty();
        taskId = keccak256(abi.encodePacked(taskHash, msg.sender, block.timestamp));
        if (tasks[taskId].createdAt != 0) revert TaskExists(taskId);

        tasks[taskId] = Task({
            taskHash: taskHash,
            employer: msg.sender,
            assignedAgent: address(0),
            bountyAmount: msg.value,
            createdAt: block.timestamp,
            deadline: block.timestamp + durationSeconds,
            status: TaskStatus.Created,
            x402ReceiptHash: bytes32(0)
        });

        emit TaskCreated(taskId, taskHash, msg.sender, msg.value, block.timestamp + durationSeconds);
    }

    function assignAgent(bytes32 taskId, address agent) external {
        Task storage task = tasks[taskId];
        if (msg.sender != task.employer) revert Unauthorized();
        if (task.status != TaskStatus.Created) revert InvalidTaskState(taskId, task.status);

        task.assignedAgent = agent;
        task.status = TaskStatus.Assigned;

        emit TaskAssigned(taskId, agent);
    }

    function submitDeliverable(bytes32 taskId, bytes32 deliverableHash) external {
        Task storage task = tasks[taskId];
        if (msg.sender != task.assignedAgent) revert Unauthorized();
        if (task.status != TaskStatus.Assigned) revert InvalidTaskState(taskId, task.status);
        if (block.timestamp > task.deadline) revert DeadlineExceeded();

        task.status = TaskStatus.Submitted;

        emit TaskSubmitted(taskId, deliverableHash);
    }

    function completeTask(bytes32 taskId, bytes32 x402ReceiptHash) external {
        Task storage task = tasks[taskId];
        if (msg.sender != task.employer && msg.sender != owner) revert Unauthorized();
        if (task.status != TaskStatus.Submitted && task.status != TaskStatus.Assigned) {
            revert InvalidTaskState(taskId, task.status);
        }

        task.status = TaskStatus.Completed;
        task.x402ReceiptHash = x402ReceiptHash;

        uint256 payout = task.bountyAmount;
        (bool success, ) = payable(task.assignedAgent).call{value: payout}("");
        require(success, "Payout transfer failed");

        emit TaskCompleted(taskId, task.assignedAgent, payout, x402ReceiptHash);
    }

    function claimRefund(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        if (msg.sender != task.employer) revert Unauthorized();
        if (task.status == TaskStatus.Completed || task.status == TaskStatus.Refunded) {
            revert InvalidTaskState(taskId, task.status);
        }
        if (block.timestamp <= task.deadline) revert DeadlineNotReached();

        task.status = TaskStatus.Refunded;
        uint256 refundAmount = task.bountyAmount;

        (bool success, ) = payable(task.employer).call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit TaskRefunded(taskId, task.employer, refundAmount);
    }
}
