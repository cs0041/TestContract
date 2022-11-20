//npx hardhat test

const { expect } = require('chai')
const exp = require('constants')
describe('Staking', function () {
  beforeEach(async function () {
    [owner, signer2] = await ethers.getSigners()

    Staking = await ethers.getContractFactory('Staking', owner)

    staking = await Staking.deploy()

    PUSDTOKEN = await ethers.getContractFactory('PUSD', owner)
    pusd = await PUSDTOKEN.deploy()

  })

  describe('deploy', function () {
    it('should set owner', async function () {
      expect(await staking.owner()).to.equal(owner.address)
    })
  })


  describe('read get function  in contract ', function () {
    it('getLengthpool()', async function () {
        expect(await staking.getLengthpool()).to.equal(0)
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        expect(await staking.getLengthpool()).to.equal(1)
    })
    it('getAllpool()', async function () {
        expect(await staking.getAllpool()).to.deep.equal([])
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        expect(await staking.getAllpool()).to.deep.equal([ethers.BigNumber.from(1),ethers.BigNumber.from(2),ethers.BigNumber.from(3)])
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
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
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
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(owner).approve(staking.address, ethers.utils.parseEther('1000'));
        const amount = ethers.utils.parseEther('100.0')
        const transaction = await staking.connect(owner).stakeEther(1, amount)
        const receipt = await transaction.wait()
        const block = await ethers.provider.getBlock(receipt.blockNumber)


        let position2 = await staking.getPositionById(1)
        expect(position2.positionId).to.equal(1)
        expect(position2.poolId).to.equal(1)
        expect(position2.symbol).to.equal('PUSD')
        expect(position2.tokenAddress).to.equal(pusd.address)
        expect(position2.walletAddress).to.equal(owner.address)
        expect(position2.createdDate).to.equal(block.timestamp)
        expect(position2.unlockDate).to.equal(block.timestamp + 86400 * lockday)
        expect(position2.percentInterest).to.equal(apy)
        expect(position2.amountStaked).to.equal(amount)
        expect(position2.amountInterest).to.equal(ethers.BigNumber.from(amount).mul(1000).div(10000).div(365))
        expect(position2.amountfee).to.equal(ethers.BigNumber.from(amount).mul(fee).div(10000))
        expect(position2.open).to.equal(true)
    })
     it('getPositionIdsForAddress()', async function () {
        expect(await staking.getPositionIdsForAddress(owner.address)).to.deep.equal([])
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        await pusd.connect(owner).approve(staking.address, ethers.utils.parseEther('1000'));
        const amount = ethers.utils.parseEther('100.0')
        await staking.connect(owner).stakeEther(1, amount)
        await staking.connect(owner).stakeEther(1, amount)
        await staking.connect(owner).stakeEther(1, amount)
        expect(await staking.getPositionIdsForAddress(owner.address)).to.deep.equal([ethers.BigNumber.from(1),ethers.BigNumber.from(2),ethers.BigNumber.from(3)])
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
       await expect(staking.connect(signer2).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)).to.be.rejectedWith('Only owner can call this fucntion')
    })
    })

    describe('owner-addPool', function () {
      it('data pool must be equal input', async function () 
      {
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
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
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 1000, 1, 500)
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 2000, 1, 500)
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, 3000, 1, 500)
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
        BeforeUserBalance = await pusd.balanceOf(owner.address)
        const fee = 500
        const apy = 1000
        const lockday = 1
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(owner).approve(staking.address, ethers.utils.parseEther('1000'));
        const amount = ethers.utils.parseEther('100.0')
        const transaction = await staking.connect(owner).stakeEther(1, amount)
        const receipt = await transaction.wait()
        const block = await ethers.provider.getBlock(receipt.blockNumber)

        let position = await staking.positions(1)
        expect(position.positionId).to.equal(1)
        expect(position.poolId).to.equal(1)
        expect(position.symbol).to.equal('PUSD')
        expect(position.tokenAddress).to.equal(pusd.address)
        expect(position.walletAddress).to.equal(owner.address)
        expect(position.createdDate).to.equal(block.timestamp)
        expect(position.unlockDate).to.equal(block.timestamp + 86400 * lockday)
        expect(position.percentInterest).to.equal(apy)
        expect(position.amountStaked).to.equal(amount)
        expect(position.amountInterest).to.equal(ethers.BigNumber.from(amount).mul(1000).div(10000).div(365))
        expect(position.amountfee).to.equal(ethers.BigNumber.from(amount).mul(fee).div(10000))
        expect(position.open).to.equal(true)
        expect(await staking.currentPositionId()).to.equal(2)

        contractBalance = await pusd.balanceOf(staking.address)
        afterUserBalance = await pusd.balanceOf(owner.address)

        expect(contractBalance).to.equal(amount)
        expect(afterUserBalance.add(amount)).to.equal(BeforeUserBalance)
      })
      it('add a lot position', async function () {
        BeforeUserBalance = await pusd.balanceOf(owner.address)
        const fee = 500
        const apy = 1000
        const lockday = 1
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(owner).approve(staking.address, ethers.utils.parseEther('1000'));
        const amount = ethers.utils.parseEther('100.0')
        await staking.connect(owner).stakeEther(1, amount)
        await staking.connect(owner).stakeEther(1, amount)
        await staking.connect(owner).stakeEther(1, amount)
        await staking.connect(owner).stakeEther(1, amount)
        await staking.connect(owner).stakeEther(1, amount)


        expect(await staking.currentPositionId()).to.equal(6)

        contractBalance = await pusd.balanceOf(staking.address)
        afterUserBalance = await pusd.balanceOf(owner.address)

        expect(contractBalance).to.equal(amount.mul(5))
        expect(afterUserBalance.add(amount.mul(5))).to.equal(BeforeUserBalance)
      })
      
    })
  })

  
   describe('changeUnlockDate()', function () {
     describe('owner', function () {
       it('changes the unlockDate', async () => {
         const fee = 500
         const apy = 1000
         const lockday = 1
         await staking
           .connect(owner)
           .addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
         await pusd
           .connect(owner)
           .approve(staking.address, ethers.utils.parseEther('100.0'))

         await staking
           .connect(owner)
           .stakeEther(1, ethers.utils.parseEther('100.0'))
         const positionOld = await staking.getPositionById(1)
         const nweUnlockDate = positionOld.unlockDate - 86400 * lockday
         await staking.connect(owner).changeUnlockDate(1, nweUnlockDate)
         const positionNew = await staking.getPositionById(1)
         expect(positionNew.unlockDate).to.be.equal(
           positionOld.unlockDate - 86400 * lockday
         )
       })
     })
     describe('non-owner', function () {
       it('reverts', async () => {
         const fee = 500
         const apy = 1000
         const lockday = 1
         await staking
           .connect(owner)
           .addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
         await pusd
           .connect(owner)
           .approve(staking.address, ethers.utils.parseEther('100.0'))

         await staking
           .connect(owner)
           .stakeEther(1, ethers.utils.parseEther('100.0'))
         const positionOld = await staking.getPositionById(1)
         const nweUnlockDate = positionOld.unlockDate - 86400 * lockday
         await staking.connect(owner).changeUnlockDate(1, nweUnlockDate)
         await expect(
           staking.connect(signer2).changeUnlockDate(1, nweUnlockDate)
         ).to.be.revertedWith('Only owner can modify unlock dates')
       })
     })
   })

   describe('modifyLockPeriods()', function () {
     describe('onwer', function () {
       it('should modify lock period and apy', async function () {
         const fee = 500
         const apy = 1000
         const lockday = 1
         await staking
           .connect(owner)
           .addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
         await staking.connect(owner).modifyLockPeriods(10, 100, 1)

         let pool = await staking.getPoolById(1)
         expect(pool.lockPeriods).to.equal(10)
         expect(pool.apy).to.equal(100)
       })
     })
     describe('non-onwer', function () {
       it('reverts', async function () {
         const fee = 500
         const apy = 1000
         const lockday = 1
         await staking
           .connect(owner)
           .addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
         await expect(
           staking.connect(signer2).modifyLockPeriods(10, 100, 1)
         ).to.be.rejectedWith('Only owner can modify staking periods')
       })
     })
   })


   

  describe('closePosition()', function () {
    describe('after unlock date', function () {
      it('transfers principal and interest', async function () {
        const fee = 500
        const apy = 1000
        const lockday = 1
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(owner).transfer(signer2.address,ethers.utils.parseEther('200.0'))
        await pusd.connect(owner).transfer(staking.address,ethers.utils.parseEther('500.0'))
        await pusd.connect(signer2).approve(staking.address, ethers.utils.parseEther('200.0'));

        const beforeUserBalance = await pusd.balanceOf(signer2.address)
        const beforeContractBalance = await pusd.balanceOf(staking.address)


        const transaction = await staking.connect(signer2).stakeEther(1, ethers.utils.parseEther('200.0'))
        const receipt = transaction.wait()
        const block = await ethers.provider.getBlock(receipt.blockNumber)
        const newUnlockDate = block.timestamp - (86400 * lockday)
        const position = await staking.getPositionById(1)
        await staking.connect(owner).changeUnlockDate(1, newUnlockDate)

        await staking.connect(signer2).closePosition(1)

        const afterUserBalance = await pusd.balanceOf(signer2.address)
        const afterContractBalance = await pusd.balanceOf(staking.address)
       
        expect(afterUserBalance).to.equal(beforeUserBalance.add(position.amountInterest) )
        expect(afterContractBalance).to.equal(beforeContractBalance.sub(position.amountInterest))


      })
    })
    describe('before unlock date', function () {
      it('transfers principal and penalize fee', async function () {
        const fee = 500
        const apy = 1000
        const lockday = 1
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(owner).transfer(signer2.address,ethers.utils.parseEther('200.0'))
        await pusd.connect(owner).transfer(staking.address,ethers.utils.parseEther('500.0'))
        await pusd.connect(signer2).approve(staking.address, ethers.utils.parseEther('200.0'));

        const beforeUserBalance = await pusd.balanceOf(signer2.address)
        const beforeOwnerBalance = await pusd.balanceOf(owner.address)
        const beforeContractBalance = await pusd.balanceOf(staking.address)

        const transaction = await staking.connect(signer2).stakeEther(1, ethers.utils.parseEther('200.0'))
        const position = await staking.getPositionById(1)


        await staking.connect(signer2).closePosition(1)

        const afterUserBalance = await pusd.balanceOf(signer2.address)
        const afterOwnerBalance = await pusd.balanceOf(owner.address)
        const afterContractBalance = await pusd.balanceOf(staking.address)

       
        expect(afterUserBalance).to.equal(beforeUserBalance.sub(position.amountfee) )
        expect(afterOwnerBalance).to.equal(beforeOwnerBalance.add(position.amountfee) )
        expect(afterContractBalance).to.equal(beforeContractBalance)


      })
    })
    describe('non-owner of that position', function () {
      it('reverts', async function () {
        const fee = 500
        const apy = 1000
        const lockday = 1
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(owner).transfer(signer2.address,ethers.utils.parseEther('200.0'))
        await pusd.connect(owner).transfer(staking.address,ethers.utils.parseEther('500.0'))
        await pusd.connect(signer2).approve(staking.address, ethers.utils.parseEther('200.0'))
        await staking.connect(signer2).stakeEther(1, ethers.utils.parseEther('200.0'))
        await expect(staking.connect(owner).closePosition(1) ).to.be.rejectedWith('Only position creator can close')
      
      })

      })
    describe('Try Close closed positions', function () {
      it('reverts', async function () {
        const fee = 500
        const apy = 1000
        const lockday = 1
        await staking.connect(owner).addPool('PUSD', 'PUSD', pusd.address, apy, lockday, fee)
        await pusd.connect(owner).transfer(signer2.address,ethers.utils.parseEther('200.0'))
        await pusd.connect(owner).transfer(staking.address,ethers.utils.parseEther('500.0'))
        await pusd.connect(signer2).approve(staking.address, ethers.utils.parseEther('200.0'))
        await staking.connect(signer2).stakeEther(1, ethers.utils.parseEther('200.0'))
        await staking.connect(signer2).closePosition(1)
        await expect(staking.connect(signer2).closePosition(1) ).to.be.rejectedWith('Position is closed')
      
      })

      })

    
  })


  


})
