//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SignatureVerification {
  function _hashMessage(address _oldSignet, address _signet, uint256 _nonce) private view returns (bytes32) {
    bytes32 messageHash = _oldSignet == address(0) ?
     keccak256(abi.encode(
       keccak256("Message(address signet,uint256 nonce)"),
       _signet,
       _nonce
     )):
     keccak256(abi.encode(
       keccak256("Message(address oldSignet,address signet,uint256 nonce)"),
       _oldSignet,
       _signet,
       _nonce
     ));
    return keccak256(abi.encodePacked(
        "\x19\x01",
        keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId)"
                ),
                keccak256(bytes("Signet")),
                keccak256(bytes("1")),
                block.chainid
          )
        ),
      messageHash
    ));
  }

  function _recoverAddress(uint8 _v, bytes32 _r, bytes32 _s, address _oldSignet, address _signet, uint256 _nonce) external view returns (address) {
    bytes32 digest = _hashMessage(_oldSignet, _signet, _nonce);
    return ecrecover(digest, _v, _r, _s);
  }
}
