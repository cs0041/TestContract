//npx hardhat test

const { expect } = require('chai')
const exp = require('constants')
describe('Faucet', function () {
  beforeEach(async function () {
    ;[owner, signer2] = await ethers.getSigners()

    PUSDTOKEN = await ethers.getContractFactory('PUSD', owner)
    pusd = await PUSDTOKEN.deploy()
    THBTOKEN = await ethers.getContractFactory('THB', owner)
    thb = await THBTOKEN.deploy()

    Faucet = await ethers.getContractFactory('Faucet', owner)
    faucet = await Faucet.deploy(pusd.address, thb.address)

    await pusd
      .connect(owner)
      .transfer(faucet.address, ethers.utils.parseEther('1000.0'))
    await thb
      .connect(owner)
      .transfer(faucet.address, ethers.utils.parseEther('1000.0'))
  })

  describe('deploy', function () {
    it('should set owner', async function () {
      expect(await faucet.owner()).to.equal(owner.address)
    })
  })

  describe('modifyTimeFaucet()', function () {
    describe('non-onwer-modifyTimeFaucet', function () {
      it('reverts', async function () {
        await expect(
          faucet.connect(signer2).modifyTimeFaucet(signer2.address, 2668948397)
        ).to.be.rejectedWith('Only owner can call this fucntion')
      })
    })
    describe('onwer-modifyTimeFaucet', function () {
      it('should modifyTimeFaucet', async function () {
        await faucet.connect(owner).modifyTimeFaucet(owner.address, 2668948397)
        expect(await faucet.timeFaucet(owner.address)).to.equal(2668948397)
      })
    })
  })

  describe('modifyLockHourPeriods()', function () {
    describe('non-onwer-modifyLockHourPeriods', function () {
      it('reverts', async function () {
        await expect(
          faucet.connect(signer2).modifyLockHourPeriods(12)
        ).to.be.rejectedWith('Only owner can call this fucntion')
      })
    })
    describe('onwer-modifyLockHourPeriods', function () {
      it('should modifyLockHourPeriods', async function () {
        expect(await faucet.lockhourPeriods()).to.equal(1)
        await faucet.connect(owner).modifyLockHourPeriods(12)
        expect(await faucet.lockhourPeriods()).to.equal(12)
      })
    })
  })

  describe('modifyAmountToken()', function () {
    describe('non-onwer-modifyAmountToken', function () {
      it('reverts', async function () {
        await expect(
          faucet.connect(signer2).modifyAmountToken(5, 5)
        ).to.be.rejectedWith('Only owner can call this fucntion')
      })
    })
    describe('onwer-modifyAmountToken', function () {
      it('should modifyAmountToken', async function () {
        expect(await faucet.amount0()).to.equal(ethers.utils.parseEther('100'))
        expect(await faucet.amount1()).to.equal(ethers.utils.parseEther('1000'))
        await faucet.connect(owner).modifyAmountToken(5, 9)
        expect(await faucet.amount0()).to.equal(ethers.utils.parseEther('5'))
        expect(await faucet.amount1()).to.equal(ethers.utils.parseEther('9'))
      })
    })
  })

  describe('togleOpen()', function () {
    describe('non-onwer-togleOpen', function () {
      it('reverts', async function () {
        await expect(faucet.connect(signer2).togleOpen()).to.be.rejectedWith(
          'Only owner can call this fucntion'
        )
      })
    })
    describe('onwer-modifyAmountToken', function () {
      it('should togleOpen', async function () {
        expect(await faucet.isOpen()).to.equal(true)
        await faucet.connect(owner).togleOpen()
        expect(await faucet.isOpen()).to.equal(false)
      })
    })
  })

  describe('withdrawAllandClose()', function () {
    describe('non-onwer-withdrawAllandClose', function () {
      it('reverts', async function () {
        await expect(
          faucet.connect(signer2).withdrawAllandClose()
        ).to.be.rejectedWith('Only owner can call this fucntion')
      })
    })
    describe('onwer-withdrawAllandClose', function () {
      it('should withdrawAllandClose', async function () {
        const beforeContractBalancePUSD = await pusd.balanceOf(faucet.address)
        const beforeContractBalanceTHB = await thb.balanceOf(faucet.address)
        await faucet.connect(owner).withdrawAllandClose()
        const afterOwnerBalancePUSD = await pusd.balanceOf(owner.address)
        const afterOwnerBalanceTHB = await thb.balanceOf(owner.address)
        expect(beforeContractBalancePUSD).to.equal(afterOwnerBalancePUSD)
        expect(beforeContractBalanceTHB).to.equal(afterOwnerBalanceTHB)
        expect(await faucet.isOpen()).to.equal(false)
      })
    })
  })

  describe('getFaucet()', function () {
    describe('getFaucet when on cooldown', function () {
      it('reverts', async function () {
        await faucet.connect(signer2).getFaucet()
        await expect(faucet.connect(signer2).getFaucet()).to.be.rejectedWith(
          'It is not time pls wait'
        )
      })
    })
    describe('getFaucet when isClose', function () {
      it('reverts', async function () {
        await faucet.connect(owner).togleOpen()
        await expect(faucet.connect(signer2).getFaucet()).to.be.rejectedWith('it Close')
      })
    })
    describe('getFaucet', function () {
      it('should getFaucet', async function () {
        const beforeUserBalancePUSD = await pusd.balanceOf(signer2.address)
        const beforeUserBalanceTHB = await thb.balanceOf(signer2.address)
        const beforeContractBalancePUSD = await pusd.balanceOf(faucet.address)
        const beforeContractBalanceTHB = await thb.balanceOf(faucet.address)
        await faucet.connect(signer2).getFaucet()
        const afterUserBalancePUSD = await pusd.balanceOf(signer2.address)
        const afterUserBalanceTHB = await thb.balanceOf(signer2.address)
        const afterContractBalancePUSD = await pusd.balanceOf(faucet.address)
        const afterContractBalanceTHB = await thb.balanceOf(faucet.address)
        expect(afterUserBalancePUSD).to.equal(await faucet.amount0())
        expect(afterUserBalanceTHB).to.equal(await faucet.amount1())
        expect(afterContractBalancePUSD).to.equal(
          beforeContractBalancePUSD.sub(await faucet.amount0())
        )
        expect(afterContractBalanceTHB).to.equal(
          beforeContractBalanceTHB.sub(await faucet.amount1())
        )
      })
    })
  })
})
