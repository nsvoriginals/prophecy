export const IDL = {
  "version": "0.1.0",
    "name": "prophecy",
    "instructions": [
        {
            "name": "initialize",
            "accounts": [
                {
                    "name": "state",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "authority",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "createMarket",
            "accounts": [
                {
                    "name": "state",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "market",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "creator",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "description",
                    "type": "string"
                },
                {
                    "name": "deadline",
                    "type": "i64"
                }
            ]
        },
        {
            "name": "placeBet",
            "accounts": [
                {
                    "name": "market",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userBet",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "user",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                },
                {
                    "name": "prediction",
                    "type": "bool"
                }
            ]
        },
        {
            "name": "settleMarket",
            "accounts": [
                {
                    "name": "market",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "creator",
                    "isMut": false,
                    "isSigner": true
                }
            ],
            "args": [
                {
                    "name": "outcome",
                    "type": "bool"
                }
            ]
        },
        {
            "name": "claimWinnings",
            "accounts": [
                {
                    "name": "market",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userBet",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "user",
                    "isMut": true,
                    "isSigner": true
                }
            ],
            "args": []
        }
    ],
    "accounts": [
        {
            "name": "GlobalState",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "totalMarkets",
                        "type": "u64"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "Market",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "creator",
                        "type": "publicKey"
                    },
                    {
                        "name": "marketId",
                        "type": "u64"
                    },
                    {
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "name": "yesAmount",
                        "type": "u64"
                    },
                    {
                        "name": "noAmount",
                        "type": "u64"
                    },
                    {
                        "name": "deadline",
                        "type": "i64"
                    },
                    {
                        "name": "settled",
                        "type": "bool"
                    },
                    {
                        "name": "outcome",
                        "type": {
                            "option": "bool"
                        }
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "UserBet",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "user",
                        "type": "publicKey"
                    },
                    {
                        "name": "market",
                        "type": "publicKey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    },
                    {
                        "name": "prediction",
                        "type": "bool"
                    },
                    {
                        "name": "claimed",
                        "type": "bool"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "MarketAlreadySettled",
            "msg": "Market has already been settled"
        },
        {
            "code": 6001,
            "name": "DeadlinePassed",
            "msg": "Deadline has passed, no more bets allowed"
        },
        {
            "code": 6002,
            "name": "BetTooSmall",
            "msg": "Bet amount must be greater than 0"
        },
        {
            "code": 6003,
            "name": "Unauthorized",
            "msg": "Only market creator can settle"
        },
        {
            "code": 6004,
            "name": "TooEarly",
            "msg": "Cannot settle before deadline"
        },
        {
            "code": 6005,
            "name": "AlreadySettled",
            "msg": "Market already settled"
        },
        {
            "code": 6006,
            "name": "NotSettled",
            "msg": "Market not settled yet"
        },
        {
            "code": 6007,
            "name": "AlreadyClaimed",
            "msg": "Winnings already claimed"
        },
        {
            "code": 6008,
            "name": "DidNotWin",
            "msg": "You did not win this bet"
        }
    ],
  "metadata": {
    "address": "H6mwQUik2uuctEaBdfCtVfukqXYtQrX4MhWnsbkAQ1L9"
  }
};