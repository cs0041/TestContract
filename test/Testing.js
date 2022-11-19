//npx hardhat test

const { expect } = require('chai')
const exp = require('constants')
describe('Staking', function () {
  beforeEach(async function () {
    [signer1, signer2] = await ethers.getSigners()

    Staking = await ethers.getContractFactory('Staking', signer1)

    staking = await Staking.deploy()

    PUSDTOKEN = await ethers.getContractFactory('PUSD', signer1)
    pusd = await PUSDTOKEN.deploy()

  })

  describe('deploy', function () {
    it('should set owner', async function () {
      expect(await staking.owner()).to.equal(signer1.address)
    })
  })


  describe('read get function  in contract ', function () {
    it('getLengthpool()', async function () {
        expect(await staking.getLengthpool()).to.equal(0)
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        expect(await staking.getLengthpool()).to.equal(1)
    })
    it('getAllpool()', async function () {
        // expect(await staking.getAllpool()).to.equal([])
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        expect(await staking.getAllpool()).to.equal([ethers.BigNumber.from(1)])
    })
     it('getPoolById()', async function () {
        let pool = await staking.getPoolById(0)
        expect(pool.poolId).to.equal(0)
        expect(pool.name).to.equal('')
        expect(pool.symbol).to.equal('')
        expect(pool.tokenAddress).to.equal('0x0000000000000000000000000000000000000000' )
        expect(pool.apy).to.equal(0)
        expect(pool.lockPeriods).to.equal(0)
        expect(pool.fee).to.equal(0)
        expect(pool.open).to.equal(false)
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        let pool2 = await staking.pools(1)
        expect(pool2.poolId).to.equal(1)
        expect(pool2.name).to.equal('PUSD')
        expect(pool2.symbol).to.equal('PUSD')
        expect(pool2.tokenAddress).to.equal(pusd.address)
        expect(pool2.apy).to.equal(1000)
        expect(pool2.lockPeriods).to.equal(1)
        expect(pool2.fee).to.equal(500)
        expect(pool2.open).to.equal(true)
    })
     it('getPositionById()', async function () {
        let position = await staking.getPositionById(0)
        expect(position.positionId).to.equal(0)
        expect(position.poolId).to.equal(0)
        expect(position.symbol).to.equal('')
        expect(position.tokenAddress).to.equal('0x0000000000000000000000000000000000000000' )
        expect(position.walletAddress).to.equal('0x0000000000000000000000000000000000000000')
        expect(position.createdDate).to.equal(0)
        expect(position.unlockDate).to.equal(0)
        expect(position.percentInterest).to.equal(0)
        expect(position.amountStaked).to.equal(0)
        expect(position.amountInterest).to.equal(0)
        expect(position.amountfee).to.equal(0)
        expect(position.open).to.equal(false)

        const fee = 500
        const apy = 1000
        const lockday = 1
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(signer1).approve(staking.address, ethers.utils.parseEther('1000'));
        const amount = ethers.utils.parseEther('100.0')
        const transaction = await staking.connect(signer1).stakeEther(1, amount)
        const receipt = await transaction.wait()
        const block = await ethers.provider.getBlock(receipt.blockNumber)


        let position2 = await staking.getPositionById(1)
        expect(position2.positionId).to.equal(1)
        expect(position2.poolId).to.equal(1)
        expect(position2.symbol).to.equal('PUSD')
        expect(position2.tokenAddress).to.equal(pusd.address)
        expect(position2.walletAddress).to.equal(signer1.address)
        expect(position2.createdDate).to.equal(block.timestamp)
        expect(position2.unlockDate).to.equal(block.timestamp + 86400 * lockday)
        expect(position2.percentInterest).to.equal(apy)
        expect(position2.amountStaked).to.equal(amount)
        expect(position2.amountInterest).to.equal(ethers.BigNumber.from(amount).mul(1000).div(10000).div(365))
        expect(position2.amountfee).to.equal(ethers.BigNumber.from(amount).mul(fee).div(10000))
        expect(position2.open).to.equal(true)
    })
     it('getPositionIdsForAddress()', async function () {
        // expect(await staking.getPositionIdsForAddress(signer1.address)).to.equal([])
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        await pusd.connect(signer1).approve(staking.address, ethers.utils.parseEther('1000'));
        const amount = ethers.utils.parseEther('100.0')
        await staking.connect(signer1).stakeEther(1, amount)
        // expect(await staking.getPositionIdsForAddress(signer1.address)).to.equal([ethers.BigNumber.from(1)])
     })
  })


  describe('addPool()', function () {
    describe('default vaule pool', function () 
    {
    it('Empty data pool', async function () {
      let pool = await staking.pools(0)
       expect(pool.poolId).to.equal(0)
       expect(pool.name).to.equal('')
       expect(pool.symbol).to.equal('')
       expect(pool.tokenAddress).to.equal('0x0000000000000000000000000000000000000000')
       expect(pool.apy).to.equal(0)
       expect(pool.lockPeriods).to.equal(0)
       expect(pool.fee).to.equal(0)
       expect(pool.open).to.equal(false)
       expect(await staking.currentPoolId()).to.equal(1)
    })
    })
    
    describe('non-onwer-addPool', function () {
    it('reverts', async function () {
        expect(staking.connect(signer2).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)).to.be.rejectedWith(
          'Only owner can call this fucntion'
        )
    })
    })

    describe('owner-addPool', function () {
      it('data pool must be equal input', async function () 
      {
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        let pool = await staking.pools(1)  
         expect(pool.poolId).to.equal(1)
         expect(pool.name).to.equal('PUSD' )
         expect(pool.symbol).to.equal('PUSD')
         expect(pool.tokenAddress).to.equal(pusd.address)
         expect(pool.apy).to.equal(1000)
         expect(pool.lockPeriods).to.equal(1)
         expect(pool.fee).to.equal(500)
         expect(pool.open).to.equal(true)
         expect(await staking.currentPoolId()).to.equal(2)
      })
      it('add a lot pool', async function () 
      {
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, 2000, 1, 500)
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, 3000, 1, 500)
         expect(await staking.currentPoolId()).to.equal(4)
      })

    })


  })

  describe('stakeEther()', function () {
    describe('default vaule positions', function () {
      it('Empty data positions', async function () {
        let position = await staking.positions(0)
        expect(position.positionId).to.equal(0)
        expect(position.poolId).to.equal(0)
        expect(position.symbol).to.equal('')
        expect(position.tokenAddress).to.equal('0x0000000000000000000000000000000000000000' )
        expect(position.walletAddress).to.equal('0x0000000000000000000000000000000000000000')
        expect(position.createdDate).to.equal(0)
        expect(position.unlockDate).to.equal(0)
        expect(position.percentInterest).to.equal(0)
        expect(position.amountStaked).to.equal(0)
        expect(position.amountInterest).to.equal(0)
        expect(position.amountfee).to.equal(0)
        expect(position.open).to.equal(false)
        expect(await staking.currentPositionId()).to.equal(1)
      })
    })

    describe('add position stakeERC20', function () {
      it('add position stakeERC20', async function () {
        BeforeUserBalance = await pusd.balanceOf(signer1.address)
        const fee = 500
        const apy = 1000
        const lockday = 1
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(signer1).approve(staking.address, ethers.utils.parseEther('1000'));
        const amount = ethers.utils.parseEther('100.0')
        const transaction = await staking.connect(signer1).stakeEther(1, amount)
        const receipt = await transaction.wait()
        const block = await ethers.provider.getBlock(receipt.blockNumber)

        let position = await staking.positions(1)
        expect(position.positionId).to.equal(1)
        expect(position.poolId).to.equal(1)
        expect(position.symbol).to.equal('PUSD')
        expect(position.tokenAddress).to.equal(pusd.address)
        expect(position.walletAddress).to.equal(signer1.address)
        expect(position.createdDate).to.equal(block.timestamp)
        expect(position.unlockDate).to.equal(block.timestamp + 86400 * lockday)
        expect(position.percentInterest).to.equal(apy)
        expect(position.amountStaked).to.equal(amount)
        expect(position.amountInterest).to.equal(ethers.BigNumber.from(amount).mul(1000).div(10000).div(365))
        expect(position.amountfee).to.equal(ethers.BigNumber.from(amount).mul(fee).div(10000))
        expect(position.open).to.equal(true)
        expect(await staking.currentPositionId()).to.equal(2)

        contractBalance = await pusd.balanceOf(staking.address)
        afterUserBalance = await pusd.balanceOf(signer1.address)

        expect(contractBalance).to.equal(amount)
        expect(afterUserBalance.add(amount)).to.equal(BeforeUserBalance)
      })
      it('add a lot position', async function () {
        BeforeUserBalance = await pusd.balanceOf(signer1.address)
        const fee = 500
        const apy = 1000
        const lockday = 1
        await staking.connect(signer1).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(signer1).approve(staking.address, ethers.utils.parseEther('1000'));
        const amount = ethers.utils.parseEther('100.0')
        await staking.connect(signer1).stakeEther(1, amount)
        await staking.connect(signer1).stakeEther(1, amount)
        await staking.connect(signer1).stakeEther(1, amount)
        await staking.connect(signer1).stakeEther(1, amount)
        await staking.connect(signer1).stakeEther(1, amount)


        expect(await staking.currentPositionId()).to.equal(6)

        contractBalance = await pusd.balanceOf(staking.address)
        afterUserBalance = await pusd.balanceOf(signer1.address)

        expect(contractBalance).to.equal(amount.mul(5))
        expect(afterUserBalance.add(amount.mul(5))).to.equal(BeforeUserBalance)
      })
      
    })
  })


})
