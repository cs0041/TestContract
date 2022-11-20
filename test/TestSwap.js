//npx hardhat test

const { expect } = require('chai')
const exp = require('constants')
describe('Swap', function () {
  beforeEach(async function () {
    [owner, signer2] = await ethers.getSigners()

    
    PUSDTOKEN = await ethers.getContractFactory('PUSD', owner)
    pusd = await PUSDTOKEN.deploy()
    THBTOKEN = await ethers.getContractFactory('THB', owner)
    thb = await THBTOKEN.deploy()

    Swap = await ethers.getContractFactory('CPAMM', owner)
    swap = await Swap.deploy(pusd.address,thb.address)

    await pusd.connect(owner).approve(swap.address, ethers.utils.parseEther('1000'));
    await thb.connect(owner).approve(swap.address, ethers.utils.parseEther('1000'));

  })

  describe('deploy', function () {
    it('should set owner', async function () {
       expect(await swap.owner()).to.equal(owner.address)
    })
  })


  describe('addLiquidity()', function () {
    describe('non-onwer-addLiquidity', function () {
    it('reverts', async function () {
       await expect(swap.connect(signer2).addLiquidity(ethers.utils.parseEther('100'),ethers.utils.parseEther('100'))).to.be.rejectedWith('Only can call this fucntion')
    })
    })
    describe('onwer-addLiquidity', function () {
    it('should addLiquidity', async function () {
      await swap.connect(owner).addLiquidity(ethers.utils.parseEther('100.0'),ethers.utils.parseEther('10.0'))
      expect(await swap.reserve0()).to.equal(ethers.utils.parseEther('100.0'))
      expect(await swap.reserve1()).to.equal(ethers.utils.parseEther('10.0'))
    })
    })
  })
  describe('swap()', function () {
    describe('try swap with token does not exist', function () {
    it('reverts', async function () {
      await expect(swap.connect(owner).swap(swap.address,ethers.utils.parseEther('100.0'),ethers.utils.parseEther('100.0'), 2668948397)).to.be.rejectedWith('invalid token')
    })
    })
    describe('try swap with amountIn <= 0 ', function () {
    it('reverts', async function () {
      await expect(swap.connect(owner).swap(pusd.address,ethers.utils.parseEther('0'),ethers.utils.parseEther('100.0'), 2668948397)).to.be.rejectedWith('amountIn must > 0')
    })
    })
    describe('try swap ', function () {
    it('should give token (x*y=k)', async function () {
      await swap.connect(owner).addLiquidity(ethers.utils.parseEther('10.0'),ethers.utils.parseEther('100.0'))
      const beforeUserBalancePUSD = await pusd.balanceOf(owner.address)
      const beforeUserBalanceTHB = await thb.balanceOf(owner.address)

      const _amountOut = await  swap.connect(owner).getAmountOut(pusd.address, ethers.utils.parseEther('1.0'))

      await swap.connect(owner).swap( pusd.address , ethers.utils.parseEther('1.0') , ethers.utils.parseEther('2.0') , 2668948397)
      
      const afterUserBalancePUSD = await pusd.balanceOf(owner.address)
      const afterUserBalanceTHB = await thb.balanceOf(owner.address)

      expect(beforeUserBalancePUSD).to.equal(afterUserBalancePUSD.add(ethers.utils.parseEther('1.0')))
      expect(beforeUserBalanceTHB).to.equal(afterUserBalanceTHB.sub(_amountOut))
    })
    })
  })
})
