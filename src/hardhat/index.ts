import type { Artifact, HardhatRuntimeEnvironment } from "./types";
import Web3 from "web3";
import _ from "lodash";
import { block, web3 } from "../network";
import { contract, Contract, Options, waitForTxConfirmations } from "../contracts";
import BN from "bn.js";
const debug = require("debug")("web3-candies");

/**
 * the global hardhat runtime environment
 */
export function hre(): HardhatRuntimeEnvironment & { web3: Web3 } {
  try {
    return require("hardhat");
  } catch (e) {
    throw new Error("optional HardHat dependency not installed!");
  }
}

/**
 * optionally tag the address as name with HRE tracer
 */
export function tag(address: string, name: string) {
  try {
    if ((hre() as any).tracer) {
      (hre() as any).tracer.nameTags[address] = name;
    }
  } catch (ignore) {}
}

export function artifact(name: string): Artifact {
  return hre().artifacts.readArtifactSync(name);
}

export async function impersonate(...address: string[]) {
  debug("impersonating", ...address);
  await hre().network.provider.send("hardhat_impersonateAccount", [...address]);
}

/**
 * Set native currency balance (ETH, BNB etc)
 */
export async function setBalance(address: string, balance: string | number | BN) {
  await hre().network.provider.send("hardhat_setBalance", [address, hre().web3.utils.toHex(balance)]);
}

export async function resetNetworkFork(blockNumber: number = getNetworkForkingBlockNumber()) {
  debug("resetNetworkFork to", blockNumber || "latest");
  await hre().network.provider.send("hardhat_reset", [
    {
      forking: {
        blockNumber,
        jsonRpcUrl: getNetworkForkingUrl(),
      },
    },
  ]);
  debug("now block", await web3().eth.getBlockNumber());
}

export function getNetworkForkingBlockNumber(): number {
  return _.get(hre().network.config, ["forking", "blockNumber"]);
}

export function getNetworkForkingUrl(): string {
  return _.get(hre().network.config, ["forking", "url"]);
}

export async function mineBlocks(seconds: number, secondsPerBlock: number) {
  debug(`mining blocks in a loop and advancing time by ${seconds} seconds, ${secondsPerBlock} seconds per block`);

  const startBlock = await block();
  for (let i = 1; i <= Math.round(seconds / secondsPerBlock); i++) {
    await hre().network.provider.send("evm_increaseTime", [secondsPerBlock]);
    await hre().network.provider.send("evm_mine");
  }

  const nowBlock = await block();
  debug(
    "was: block",
    startBlock.number,
    "timestamp",
    new Date(Number(startBlock.timestamp) * 1000),
    "now: block",
    nowBlock.number,
    "timestamp",
    new Date(Number(nowBlock.timestamp) * 1000)
  );
  return nowBlock;
}

export async function mineBlock(seconds: number) {
  debug(`mining 1 block and advancing time by ${seconds} seconds`);
  const startBlock = await block();
  await hre().network.provider.send("evm_increaseTime", [seconds]);
  await hre().network.provider.send("evm_mine");

  const nowBlock = await block();
  debug(
    "was: block",
    startBlock.number,
    "timestamp",
    new Date(Number(startBlock.timestamp) * 1000),
    "now: block",
    nowBlock.number,
    "timestamp",
    new Date(Number(nowBlock.timestamp) * 1000)
  );
  return nowBlock;
}

export async function deployArtifact<T extends Contract>(
  contractName: string,
  opts: Options & { from: string },
  constructorArgs?: any[],
  waitForConfirmations: number = 0
): Promise<T> {
  debug("deploying", contractName);
  const _artifact = artifact(contractName);
  const tx = contract<T>(_artifact.abi, "").deploy({ data: _artifact.bytecode, arguments: constructorArgs }).send(opts);

  if (waitForConfirmations) {
    await waitForTxConfirmations(tx, waitForConfirmations);
  }

  const deployed = await tx;
  debug("deployed", contractName, deployed.options.address, "deployer", opts.from);
  tag(deployed.options.address, contractName);
  return contract<T>(_artifact.abi, deployed.options.address, deployed.options);
}
