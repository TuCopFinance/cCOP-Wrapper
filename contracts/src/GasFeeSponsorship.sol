// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

/**

  /$$$$$$                   /$$$$$$$$                                                         
 /$$__  $$                 | $$_____/                                                         
| $$  \__/ /$$$$$$  /$$$$$$| $$    /$$$$$$  /$$$$$$                                           
| $$ /$$$$|____  $$/$$_____| $$$$$/$$__  $$/$$__  $$                                          
| $$|_  $$ /$$$$$$|  $$$$$$| $$__| $$$$$$$| $$$$$$$$                                          
| $$  \ $$/$$__  $$\____  $| $$  | $$_____| $$_____/                                          
|  $$$$$$|  $$$$$$$/$$$$$$$| $$  |  $$$$$$|  $$$$$$$                                          
 \______/ \_______|_______/|__/   \_______/\_______/                                          
                                                                                              
                                                                                              
                                                                                              
  /$$$$$$                                                                /$$      /$$         
 /$$__  $$                                                              | $$     |__/         
| $$  \__/ /$$$$$$  /$$$$$$ /$$$$$$$  /$$$$$$$ /$$$$$$  /$$$$$$  /$$$$$$| $$$$$$$ /$$ /$$$$$$ 
|  $$$$$$ /$$__  $$/$$__  $| $$__  $$/$$_____//$$__  $$/$$__  $$/$$_____| $$__  $| $$/$$__  $$
 \____  $| $$  \ $| $$  \ $| $$  \ $|  $$$$$$| $$  \ $| $$  \__|  $$$$$$| $$  \ $| $| $$  \ $$
 /$$  \ $| $$  | $| $$  | $| $$  | $$\____  $| $$  | $| $$      \____  $| $$  | $| $| $$  | $$
|  $$$$$$| $$$$$$$|  $$$$$$| $$  | $$/$$$$$$$|  $$$$$$| $$      /$$$$$$$| $$  | $| $| $$$$$$$/
 \______/| $$____/ \______/|__/  |__|_______/ \______/|__/     |_______/|__/  |__|__| $$____/ 
         | $$                                                                       | $$      
         | $$                                                                       | $$      
         |__/                                                                       |__/      

 * @title GasFeeSponsorship
 * @author jistro.eth
 * @notice Contract that sponsors gas fees for verified users using Self Protocol
 * @dev Inherits from SelfVerificationRoot to implement identity verification and gas fee sponsorship
 */
contract GasFeeSponsorship is SelfVerificationRoot {
    //🬾🬍🬾🬱🬃🬆🬠🬿🬶🬽🬒🬖🬱🬘🬦🬭🬓🬼🬜🬁🬚🬛🬋🬪🬡🬥🬟🬆🬇🬭🬄🬉 Errors 🬌🬱🬨🬼🬝🬽🬩🬩🬩🬰🬩🬋🬈🬶🬛🬦🬗🬠🬂🬇🬉🬭🬿🬴🬚🬿🬫🬭🬜🬰🬺🬢🬈
    error UnauthorizedAccount();
    error NoFundsToSponsor();
    error TooManySponsors();
    error TransferFailed();
    error WaitingPeriodNotExpired();

    //🬘🬾🬹🬠🬓🬺🬎🬋🬉🬲🬂🬯🬚🬉🬯🬜🬏🬃🬿🬋🬅🬲🬽🬯🬊🬃🬒🬏🬮🬰🬌🬥 Structs 🬻🬗🬍🬎🬠🬷🬹🬅🬧🬡🬥🬞🬈🬨🬑🬉🬢🬯🬹🬚🬊🬏🬥🬭🬕🬡🬯🬵🬥🬘🬝🬉
    struct AddressTypeProposal {
        address current;
        address proposal;
        uint256 timeToAccept;
    }

    struct InfoVerification {
        uint256 timeStamp;
        uint8 timesToSponsor;
        /*ISelfVerificationRoot.GenericDiscloseOutputV2 output;
        bytes userData;
        uint256 trasformedUserData; // Store transformed user data as uint256*/
    }

    //🬢🬣🬚🬡🬺🬍🬏🬬🬃🬚🬀🬈🬩🬝🬳🬇🬑🬜🬾🬢🬧🬇🬖🬥🬵🬬🬬🬲 State Variables 🬓🬿🬬🬌🬪🬒🬔🬸🬁🬔🬹🬫🬾🬿🬡🬴🬅🬷🬶🬍🬁🬺🬛🬒🬮🬭🬟🬩
    bytes32 private constant VERIFICATION_CONFIG_ID =
        0x76dde44ad08950385c0a76f3f372f863fc83e28a1a0e0ac47ecfeee6cbaf50a7;
    uint256 private constant WAITING_PERIOD = 1 days;
    AddressTypeProposal admin;
    mapping(address => InfoVerification) infoVerifications;

    //🬟🬡🬁🬓🬝🬰🬬🬮🬋🬆🬚🬦🬪🬠🬻🬉🬘🬜🬸🬘🬭🬩🬚🬜🬦🬃🬳🬖🬓🬝🬵🬔 Modifier 🬞🬖🬜🬠🬨🬃🬗🬩🬭🬂🬱🬸🬏🬉🬞🬙🬮🬧🬀🬔🬐🬏🬶🬘🬉🬩🬜🬓🬍🬷🬈
    modifier onlyAdmin() {
        if (msg.sender != admin.current) {
            revert UnauthorizedAccount();
        }
        _;
    }

    //🬩🬋🬍🬠🬥🬻🬡🬤🬣🬺🬔🬞🬬🬉🬙🬛🬤🬾🬤🬌🬽🬯🬙🬦🬘🬥🬇🬬🬣🬈 Constructor 🬤🬣🬟🬈🬒🬨🬚🬢🬉🬒🬾🬹🬒🬀🬣🬘🬵🬇🬟🬍🬌🬽🬬🬧🬢🬏🬢🬠🬫🬄
    /**
     * @notice Constructor for the contract
     * @dev Initializes the contract with verification hub and admin addresses
     * @param _identityVerificationHubV2Address The address of the Identity Verification Hub V2
     * @param _adminAddress The address of the initial admin for the contract
     */
    constructor(
        address _identityVerificationHubV2Address,
        address _adminAddress
    ) SelfVerificationRoot(_identityVerificationHubV2Address, 0) {
        admin.current = _adminAddress;
    }

    //🬨🬟🬣🬡🬋🬴🬹🬉🬮🬣🬆🬫🬨🬺🬊🬠🬒🬛🬀🬱🬱🬐🬘🬃🬑🬶🬬🬔🬛 Self Handling 🬜🬲🬁🬜🬻🬻🬀🬃🬺🬊🬆🬩🬡🬈🬻🬮🬅🬬🬰🬐🬳🬥🬱🬼🬲🬝🬟🬺🬺
    /**
     * @notice Custom verification hook that handles gas fee sponsorship after successful identity verification
     * @dev Overrides the parent contract's hook to implement sponsorship logic with rate limiting
     * @param _output The verification output containing user identifier and other verification data
     * @param _userData Encoded amount to sponsor as bytes that will be converted to uint256
     * @custom:security Implements rate limiting: max 3 sponsorships per user per 7 days
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory _output,
        bytes memory _userData
    ) internal override {
        uint256 amountToSponsor = bytesToUint256(_userData);

        //verifica si puede cubrir el patrocinio
        if (address(this).balance < amountToSponsor) {
            revert NoFundsToSponsor();
        }

        address userAddress = address(uint160(_output.userIdentifier));

        if (infoVerifications[userAddress].timeStamp == 0) {
            infoVerifications[userAddress] = InfoVerification({
                timeStamp: block.timestamp,
                timesToSponsor: 1
            });
        } else {
            if (infoVerifications[userAddress].timesToSponsor < 3) {
                infoVerifications[userAddress].timesToSponsor++;
            } else {
                if (
                    block.timestamp - infoVerifications[userAddress].timeStamp >
                    7 days
                ) {
                    infoVerifications[userAddress].timesToSponsor = 1;
                    infoVerifications[userAddress].timeStamp = block.timestamp;
                } else {
                    revert TooManySponsors();
                }
            }
        }

        // Transfer the sponsorship amount to the user
        (bool success, ) = userAddress.call{value: amountToSponsor}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    //🬒🬾🬖🬹🬸🬠🬪🬛🬪🬛🬈🬍🬸🬃🬣🬁🬏🬔🬹🬡🬂🬞🬘🬩🬗🬫🬌🬶 Admin Functions 🬋🬣🬼🬆🬓🬄🬳🬆🬬🬶🬀🬸🬪🬄🬄🬰🬁🬍🬗🬯🬚🬏🬎🬭🬪🬣🬃🬽

    /**
     * @notice Proposes a new admin address.
     * @dev Only the current admin can call this. Sets the candidate and the acceptance time.
     * @param _newAdmin Address of the proposed new admin.
     */
    function proposeNewAdminProposal(address _newAdmin) external onlyAdmin {
        admin.proposal = _newAdmin;
        admin.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    /**
     * @notice Cancels the current admin proposal.
     * @dev Only the current admin can call this. Resets the proposal and acceptance time.
     */
    function cancelNewAdminProposal() external onlyAdmin {
        admin.proposal = address(0);
        admin.timeToAccept = 0;
    }

    /**
     * @notice Accepts the admin proposal after the waiting period has expired.
     * @dev Only the proposed admin can call this. Changes the admin if the waiting period has passed.
     */
    function acceptNewAdminProposal() external {
        if (msg.sender != admin.proposal) {
            revert UnauthorizedAccount();
        }
        if (block.timestamp < admin.timeToAccept) {
            revert WaitingPeriodNotExpired();
        }

        address previousAdmin = admin.current;
        admin = AddressTypeProposal({
            current: admin.proposal,
            proposal: address(0),
            timeToAccept: 0
        });
    }

    /**
     * @notice Sets the verification scope for the contract
     * @dev Only admin can call this function to update the verification scope
     * @param _scope The new scope value to set for verification
     */
    function setScope(uint256 _scope) external onlyAdmin {
        _setScope(_scope);
    }

    /**
     * @notice Withdraws funds from the contract to a specified address
     * @dev Only admin can call this function to withdraw contract funds
     * @param _amount The amount of funds to withdraw (in wei)
     * @param _to The address to send the withdrawn funds to
     */
    function withdrawFunds(uint256 _amount, address _to) external onlyAdmin {
        payable(_to).transfer(_amount);
    }

    /**
     * @notice Allows anyone to send CELO tokens to the contract for sponsorship funding
     * @dev Payable function that accepts CELO tokens to fund the sponsorship pool
     * @custom:revert NoFundsToSponsor if no value is sent with the transaction
     */
    function sendCeloToContract() external payable {
        if (msg.value == 0) {
            revert NoFundsToSponsor();
        }
    }

    //🬳🬳🬦🬳🬒🬏🬺🬸🬳🬘🬒🬥🬟🬱🬍🬭🬳🬒🬴🬈🬆🬮🬛🬌🬢🬳🬲🬺🬕🬙🬠🬭 Getters 🬕🬋🬣🬲🬡🬉🬍🬹🬸🬱🬷🬔🬠🬭🬡🬜🬥🬃🬃🬢🬀🬳🬜🬿🬏🬘🬋🬋🬗🬆🬬🬎

    /**
     * @notice Returns the verification configuration ID for the contract
     * @dev Overrides parent contract method to return the constant verification config ID
     * @param _destinationChainId Chain ID parameter (unused but required by interface)
     * @param _userIdentifier User identifier parameter (unused but required by interface)
     * @param _userDefinedData User defined data parameter (unused but required by interface)
     * @return bytes32 The verification configuration ID
     */
    function getConfigId(
        bytes32 _destinationChainId,
        bytes32 _userIdentifier,
        bytes memory _userDefinedData
    ) public view override returns (bytes32) {
        return VERIFICATION_CONFIG_ID;
    }

    /**
     * @notice Retrieves verification information for a specific user
     * @dev Returns the verification data stored for the given user address
     * @param _user The address of the user to query
     * @return InfoVerification memory struct containing timestamp and sponsorship count
     */
    function getUserInfo(
        address _user
    ) external view returns (InfoVerification memory) {
        return infoVerifications[_user];
    }

    /**
     * @notice Retrieves complete admin information including current admin and any pending proposals
     * @dev Returns the full admin struct with current admin, proposed admin, and acceptance timestamp
     * @return AddressTypeProposal memory struct containing all admin-related data
     */
    function getAdminFullData()
        external
        view
        returns (AddressTypeProposal memory)
    {
        return admin;
    }

    /**
     * @notice Returns the current balance of the contract
     * @dev Gets the total amount of CELO tokens available for sponsorship
     * @return uint256 The contract balance in wei
     */
    function getAmountOnContract() external view returns (uint256) {
        return address(this).balance;
    }

    //🬳🬳🬦🬳🬒🬺🬸🬳🬘🬒🬟🬱🬍🬭🬳🬒🬆🬌🬢🬳🬲🬺🬕🬙🬠🬭 Internal functions 🬕🬋🬣🬲🬡🬉🬍🬹🬸🬱🬷🬔🬜🬥🬃🬃🬢🬀🬳🬜🬿🬏🬘🬋🬆🬬🬎

    /**
     * @notice Converts bytes representing ASCII digits to uint256
     * @dev Parses ASCII-encoded decimal numbers from bytes data
     * @param _data Bytes containing ASCII digits ('0'-'9')
     * @return uint256 The converted number
     * @custom:revert "Invalid ASCII digit" if any byte is not a valid ASCII digit (0x30-0x39)
     */
    function bytesToUint256(
        bytes memory _data
    ) internal pure returns (uint256) {
        uint256 result = 0;

        for (uint256 i = 0; i < _data.length; i++) {
            uint8 digit = uint8(_data[i]);

            // Check if it's a valid ASCII digit (0x30-0x39 = '0'-'9')
            require(digit >= 0x30 && digit <= 0x39, "Invalid ASCII digit");

            // Convert ASCII to actual digit and build the number
            result = result * 10 + (digit - 0x30);
        }

        return result;
    }
}
