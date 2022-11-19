// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Staking{
    using SafeMath for uint256;
    address public owner;

    uint256 public currentPoolId = 1;
    mapping(uint256 => Pool) public pools;
    uint256[] public allPoolId;
    

    struct Pool{
        uint256 poolId;
        string name;
        string symbol;
        address tokenAddress;
        uint256 apy;
        uint256 lockPeriods;
        uint256 fee;
        bool open;

    } 

    struct Position{
        uint256 positionId;
        uint256 poolId;
        string symbol;
        address tokenAddress;
        address walletAddress;
        uint256 createdDate;
        uint256 unlockDate;
        uint256 percentInterest;
        uint256 amountStaked;
        uint256 amountInterest;
        uint256 amountfee;
        bool open;
    }



    uint public currentPositionId;
    mapping(uint => Position) public positions;
    mapping(address => uint[]) public positionIdsByAddress;
    // mapping(uint => uint) public tiers;
    // uint[] public lockPeriods;

    constructor()  {
        owner = msg.sender;
        currentPositionId = 1;
        // tiers[30] = 700;
        // tiers[90] = 1000;
        // tiers[180] = 1200;

        // lockPeriods.push(30);
        // lockPeriods.push(90);
        // lockPeriods.push(180);
    }

    function addPool(
    string calldata name,
    string calldata symbol,
    address tokenAddress,
    uint256 apy,
    uint256 _lockPeriods,
    uint256 _fee
    ) external onlyOwner {
        pools[currentPoolId] = Pool(
        currentPoolId,
        name,
        symbol,
        tokenAddress,
        apy,
        _lockPeriods,
        _fee,
        true
        );

        allPoolId.push(currentPoolId);
        currentPoolId +=1;
    }

    function getLengthpool() public view returns(uint256){
        return allPoolId.length;
    }

    function getAllpool() external view returns(uint[] memory){
        return allPoolId;
    }

    function stakeEther(uint256 poolId,uint256 amount) external {
        require(pools[poolId].poolId>0, "don't have this poolID");
        uint lockPeriods = pools[poolId].lockPeriods;
        uint apy =  pools[poolId].apy;
        address addressToken = pools[poolId].tokenAddress;
        uint fee = pools[poolId].fee;
       
        positions[currentPositionId] = Position(
            currentPositionId,
            poolId,
            pools[poolId].symbol,
            addressToken,
            msg.sender,
            block.timestamp,
            block.timestamp + (lockPeriods * 1 days),
            apy,
            amount,
            calculateInterest(apy,lockPeriods,amount),
            (amount*(fee))/10000,
            true
        );

         IERC20(addressToken).transferFrom(msg.sender, address(this), amount);


        positionIdsByAddress[msg.sender].push(currentPositionId);
        currentPositionId+=1;
    }

    function calculateInterest(uint basisPoints,uint numDays,uint weiAmount) private pure returns(uint){
        return (((basisPoints*weiAmount)/10000)/365)*numDays; // 700 / 10000 => 0.07
    }

    function modifyLockPeriods(uint newTime,uint basisPoints,uint256 poolId) external {
        require(owner == msg.sender,"Only owner can modify staking periods");
        pools[poolId].apy = basisPoints;
        pools[poolId].lockPeriods = newTime;
    }

    function getPoolById(uint poolID) external view returns (Pool memory){
        return pools[poolID];
    }

    function getPositionById(uint positionId) external view returns(Position memory){
        return positions[positionId];
    }

    function getPositionIdsForAddress(address walletAddress) external view returns(uint[] memory){
        return positionIdsByAddress[walletAddress];
    }

    function changeUnlockDate(uint positionId,uint newUnlock) external{
          require(owner == msg.sender,"Only owner can modify unlock dates");

          positions[positionId].unlockDate = newUnlock;
    }

    function closePosition(uint positionId) external {
        require(positions[positionId].walletAddress == msg.sender,'Only position creator can close');
        require(positions[positionId].open ==  true,'Position is closed');

        positions[positionId].open = false;
        address addressToken = positions[positionId].tokenAddress;
        uint256 Fee = positions[positionId].amountfee;

        if(block.timestamp > positions[positionId].unlockDate){
            uint amount = positions[positionId].amountStaked +  positions[positionId].amountInterest;
            IERC20(addressToken).transfer(msg.sender, amount);
            
        }else{
            uint amount = (positions[positionId].amountStaked).sub(Fee) ;
            IERC20(addressToken).transfer(msg.sender, amount);
            IERC20(addressToken).transfer(owner, Fee);

        }

    }

    modifier onlyOwner {
        require(owner == msg.sender,'Only owner can call this fucntion');
        _;
    }

}