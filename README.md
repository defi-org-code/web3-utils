# Web3 Candies 🍬🍭🍦

> Sweet Web3 + TypeScript + HardHat (optional) development stack

## Installation

`npm install --save @defi.org/web3-candies`

**If not using hardhat, or running in a browser**, skip the optional dependencies: `--omit optional`

## Usage example

```typescript
import { bn18, fmt18, ether, erc20s, erc20, account, maxUint256 } from "@defi.org/web3-candies";
import { resetNetworkFork } from "@defi.org/web3-candies/dist/hardhat"; // to allow hardhat dependencies to be optional

const x = bn18("1,000.1234"); // x = "1000123400000000000000" [bn.js object representing wei, parsed with 18 decimals]
console.log(x.gt(ether)); // true
console.log(fmt18(x)); // prints "1,000.1234"

const owner = await account(); // web3 test account [0]

await erc20s.eth.WETH().methods.balanceOf(owner).call(); // WETH balance of

await erc20s.eth.WETH().method.deposit().send({ value: await erc20s.eth.WETH().amount(123.456), from: owner});

console.log(await erc20s.eth.WETH().amount(123.456)); // prints 123456000000000000000
console.log(await erc20s.eth.USDC().mantissa("123456000")); // prints 123456000000000000000 (18 decimals)

const myToken = erc20("foo", myTokenAddress); // web3 instantiated ERC20 Contract
await myToken.methods.approve(other, maxUint256).send({ from: owner }); // approve max uint value for other to spend
```

> run tests with env variable `DEBUG=web3-candies` to see logs

> use `hardhatDefaultConfig` in hardhat.config.ts for sugary hardhat defaults

## Sweets included

> See the tests for working examples

### bn.js utils

- `bn`: convert `string|number|bn` to `bn.js` object
- `bn3, bn6, bn8, bn9, bn12, bn18`: convert human readable `string|number` to `bn.js` object, handling commas and decimals
- `fmt3, fmt6, fmt8, fmt9, fmt12, fmt18`: convert `bn.js` object to human readable `string`, handling commas and decimals
- `to18, to6, to3...`: convert to decimals, losing percision
- `zero, ether, maxUint256, zeroAddress, `: hardcoded useful values
- `sqrt`: compute square root of BN

### ERC20s, NFTs

- `erc20s.eth...`: well known Ethereum ERC20 tokens
- `erc20s.bsc...`: well known BNB ERC20 tokens
- `erc20<T>(...)`: web3 ERC20 contract, with optional extending abi to merge
- `await erc20s.eth.WETH().decimals()`: cached version of decimals method
- `await erc20s.eth.WETH().amount(1.234)`: returns amount in wei, converted to token decimals (cached)
- `await erc20s.eth.USDC().mantissa("100")`: returns amount in **18 decimals**, given amount in token decimals (in this case `100e18`) (cached)

### contract utils

- `contract<T>(...)`: create web3 Contract instance, supporting types
- `deployArtifact(...)`: quickly deploy a compiled contract, for ex from tests
- `parseEvents`: parse tx receipt events
- `etherscanVerify(...)`: verify sources for previously deployed contracts
- `waitForTxConfirmations`: pass tx object to wait for tx confirmations

### network utils

- `web3()`: the globally accesible singleton. call `setWeb3Instance(web3)` if needed
- `networks.eth...`: constants
- `account`: alias for web3.accounts
- `block`: alias for web3.getBlock, with parsed timestamp
- `estimatedBlockNumber`: estimate block number by timestamp

### hardhat utils

> to allow hh to be optional, import from '@defi.org/web3-candies/dist/hardhat'

- `dist/hardhat/deploy`: deployment script with prompts and confirmations, saves deployment artifacts locally, waits for confirmations, optionally uploads sources to etherscan
- `hre()`: the globally accessible singleton
- `tag`: tag address for use with hre.tracer in logs
- `artifact`: read compiled artifact
- `impersonate`: impersonate accounts
- `setBalance`: sets account native token balance
- `resetNetworkFork`: resets the fork, with optional blockNumber
- `getNetworkForkingBlockNumber`, `getNetworkForkingUrl`: read hardhat config
- `mineBlocks`: mine blocks in a loop, simulating chain progression with timestamps
- `mineBlock`: mine a single block with the given timestamp

### test utils

- `useChaiBN()`: use bn.js in chai tests assertions, ex. `expect(ether).bignumber.gt(zero)`
- `expectRevert`: expects given fn to revert, containing reason string or regex

### timing utils

- `throttle(this, seconds, fn)`: sugar for lodash throttle
- `sleep`: async sleep seconds
- `keepTrying`: keep trying to invoke fn catching and logging exceptions, with 1 sec sleep between invocations
- `preventMacSleep`: runs a shell subprocess that prevents macbooks from sleeping

### peerDependencies

- Default (recommended) Web3 + Hardhat development dependencies are installed
    - Use the bundled tsconfig, solhint, and other project files as a starting point

### How to manually verify sources in Etherscan in case of an error during deploy?

- First, try running `etherscanVerify`
- After running `deploy` script, the `deployments` artifact backup should hold build-info json with all the metadata required
- Alternatively, after compiling with hardhat, `./artifacts/build-info` should have this json
- Extract the object under `input`: this is the Solidity standard-json-input required by Etherscan
- Constructor arguments should be sent abi-encoded to Etherscan, this is printed during the deploy script, also accessible via `abiEncodedConstructorArgs` function
