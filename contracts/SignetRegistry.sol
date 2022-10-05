//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface ISignatureVerification {
    function _recoverAddress(uint8 _v, bytes32 _r,
      bytes32 _s, address _oldSignet, address _signet,
      uint256 _nonce) external view returns (address);
}

contract SignetRegistry is Initializable {
  address signatureVerificationContract;
  address owner;

  mapping(address => address) public signets;
  mapping(address => uint) public nonces;
  event SignetChanged(address previous, address indexed signet, address indexed owner);

  function initialize(address _owner, address _signatureVerificationContract) public initializer {
        owner = _owner;
        signatureVerificationContract = _signatureVerificationContract;
    }

  function _registerSignet(address _signet, address _owner) internal {
    require(signets[_signet] == address(0), 'Signet already in use');
    signets[_signet] = _owner;
    emit SignetChanged(address(0), _signet, _owner);
  }

  function _revokeSignet(address _signet, address _owner) internal {
    require(signets[_signet] == _owner);
    delete signets[_signet];
    emit SignetChanged(_signet, address(0), _owner);
  }

  function _changeSignet(address _oldSignet, address _newSignet, address _owner) internal {
    require(signets[_oldSignet] == _owner, 'Permission denied');
    _revokeSignet(_oldSignet, _owner);
    _registerSignet(_newSignet, _owner);
  }

  function registerSignet(address _signet) external {
    _registerSignet(_signet, msg.sender);
  }

  function registerSignetFromSignature(address _signet, address _owner, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) external {
    require(_verifySignature(address(0), _signet, _owner, _nonce, _v, _r, _s) == _owner, 'Invalid signature');
    _registerSignet(_signet, _owner);
  }

  function revokeSignet(address _signet) external {
    _revokeSignet(_signet, msg.sender);
  }

  function revokeSignetFromSignature(address _signet, address _owner, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) external {
    require(_verifySignature(address(0), _signet, _owner, _nonce, _v, _r, _s) == _owner, 'Invalid signature');
    _revokeSignet(_signet, _owner);
  }

  function changeSignet(address _oldSignet, address _newSignet) external {
    _changeSignet(_oldSignet, _newSignet, msg.sender);
  }

  function changeSignetFromSignature(address _oldSignet, address _newSignet, address _owner, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) external {
    require(_verifySignature(_oldSignet, _newSignet, _owner, _nonce, _v, _r, _s) == _owner, 'Invalid signature');
    _changeSignet(_oldSignet, _newSignet, _owner);
  }

  function _verifySignature(address _oldSignet, address _signet, address _owner, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s) internal returns(address) {
    require(nonces[_owner] == _nonce, 'Invalid nonce');
    nonces[_owner]++;
    return ISignatureVerification(signatureVerificationContract)._recoverAddress(_v, _r, _s, _oldSignet, _signet, _nonce);
  }

  function changeContractOwner(address _newOwner) external {
    require(msg.sender == owner, 'Only the owner can call this function');
    owner = _newOwner;
  }

  function changeSignatureVerificationContract(address _newContract) external {
    require(msg.sender == owner, 'Only the owner can call this function');
    signatureVerificationContract = _newContract;
  }
}
