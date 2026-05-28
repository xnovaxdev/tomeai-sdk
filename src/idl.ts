/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tome.json`.
 */
export type Tome = {
  "address": "DUTEoWgApX4CM37QJfmLqUJdyWNM8qMXA5q5ry6W7Sje",
  "metadata": {
    "name": "tome",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buyAccess",
      "docs": [
        "Buy full read access to a vault (SOL): pay seller + create a paid grant."
      ],
      "discriminator": [
        43,
        44,
        100,
        66,
        217,
        50,
        150,
        204
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "vault",
          "relations": [
            "listing"
          ]
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "grant",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  97,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "buyAccessToken",
      "docs": [
        "Buy full read access to a vault ($TOME): pay seller + create a paid grant."
      ],
      "discriminator": [
        207,
        153,
        209,
        57,
        132,
        219,
        3,
        156
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "vault",
          "relations": [
            "listing"
          ]
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "buyerToken",
          "writable": true
        },
        {
          "name": "sellerToken",
          "writable": true
        },
        {
          "name": "grant",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  97,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createVault",
      "docs": [
        "Create a new memory vault owned by the signer."
      ],
      "discriminator": [
        29,
        237,
        247,
        208,
        193,
        82,
        54,
        135
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "nameHash"
              }
            ]
          }
        },
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "agent"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "nameHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "visibility",
          "type": {
            "defined": {
              "name": "visibility"
            }
          }
        },
        {
          "name": "tags",
          "type": {
            "vec": "string"
          }
        }
      ]
    },
    {
      "name": "deleteVault",
      "docs": [
        "Close a vault and reclaim its rent."
      ],
      "discriminator": [
        99,
        171,
        186,
        178,
        201,
        17,
        81,
        238
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault",
            "agent"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "forkVault",
      "docs": [
        "Fork a public vault under the signer, linking to the parent."
      ],
      "discriminator": [
        187,
        68,
        94,
        152,
        98,
        82,
        231,
        130
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "forker"
              },
              {
                "kind": "arg",
                "path": "nameHash"
              }
            ]
          }
        },
        {
          "name": "source"
        },
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "forker"
              }
            ]
          }
        },
        {
          "name": "forker",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "nameHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "grantAccess",
      "docs": [
        "Grant another wallet access to a vault."
      ],
      "discriminator": [
        66,
        88,
        87,
        113,
        39,
        22,
        27,
        165
      ],
      "accounts": [
        {
          "name": "grant",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  97,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "arg",
                "path": "grantee"
              }
            ]
          }
        },
        {
          "name": "vault"
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "grantee",
          "type": "pubkey"
        },
        {
          "name": "permission",
          "type": {
            "defined": {
              "name": "permission"
            }
          }
        },
        {
          "name": "grantType",
          "type": {
            "defined": {
              "name": "grantType"
            }
          }
        },
        {
          "name": "expiry",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initializeConfig",
      "docs": [
        "Create the singleton protocol config (admin, once)."
      ],
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "feeBps",
          "type": "u16"
        },
        {
          "name": "treasury",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "listVault",
      "docs": [
        "List a vault on the marketplace."
      ],
      "discriminator": [
        207,
        150,
        120,
        180,
        8,
        164,
        150,
        17
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "vault"
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "pricePerQuery",
          "type": "u64"
        },
        {
          "name": "previewCount",
          "type": "u8"
        },
        {
          "name": "category",
          "type": {
            "defined": {
              "name": "category"
            }
          }
        }
      ]
    },
    {
      "name": "marketplaceQuery",
      "docs": [
        "Pay for a query against a listed vault (simple SOL transfer + counters)."
      ],
      "discriminator": [
        138,
        175,
        47,
        163,
        228,
        163,
        162,
        121
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "vault",
          "relations": [
            "listing"
          ]
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "seller",
          "docs": [
            "The seller — must be the vault owner. Receives the payment."
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marketplaceQueryToken",
      "docs": [
        "Pay for a query in SPL tokens (Model 2: value settles into the token)."
      ],
      "discriminator": [
        31,
        130,
        226,
        205,
        196,
        198,
        98,
        164
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "vault",
          "relations": [
            "listing"
          ]
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "buyerToken",
          "writable": true
        },
        {
          "name": "sellerToken",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerAgent",
      "docs": [
        "Register the signer as an agent (creates their AgentRegistry passport)."
      ],
      "discriminator": [
        135,
        157,
        66,
        195,
        2,
        113,
        175,
        30
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "revokeAccess",
      "docs": [
        "Revoke a previously issued access grant."
      ],
      "discriminator": [
        106,
        128,
        38,
        169,
        103,
        238,
        102,
        147
      ],
      "accounts": [
        {
          "name": "grant",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  97,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "arg",
                "path": "grantee"
              }
            ]
          }
        },
        {
          "name": "vault"
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        }
      ],
      "args": [
        {
          "name": "grantee",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "unlistVault",
      "docs": [
        "Remove a vault listing from the marketplace."
      ],
      "discriminator": [
        244,
        140,
        128,
        219,
        17,
        0,
        205,
        236
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "vault"
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "updateVault",
      "docs": [
        "Update vault metadata and/or commit a new memory state (merkle_root, etc)."
      ],
      "discriminator": [
        67,
        229,
        185,
        188,
        226,
        11,
        210,
        60
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "vault"
          ]
        }
      ],
      "args": [
        {
          "name": "description",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "visibility",
          "type": {
            "option": {
              "defined": {
                "name": "visibility"
              }
            }
          }
        },
        {
          "name": "tags",
          "type": {
            "option": {
              "vec": "string"
            }
          }
        },
        {
          "name": "storageRef",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "merkleRoot",
          "type": {
            "option": {
              "array": [
                "u8",
                32
              ]
            }
          }
        },
        {
          "name": "entryCount",
          "type": {
            "option": "u32"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "accessGrant",
      "discriminator": [
        167,
        55,
        184,
        237,
        74,
        242,
        0,
        109
      ]
    },
    {
      "name": "agentRegistry",
      "discriminator": [
        6,
        34,
        128,
        124,
        33,
        136,
        199,
        171
      ]
    },
    {
      "name": "memoryVault",
      "discriminator": [
        113,
        139,
        57,
        17,
        27,
        116,
        85,
        55
      ]
    },
    {
      "name": "protocolConfig",
      "discriminator": [
        207,
        91,
        250,
        28,
        152,
        179,
        215,
        209
      ]
    },
    {
      "name": "vaultListing",
      "discriminator": [
        203,
        113,
        112,
        110,
        217,
        66,
        229,
        89
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "nameTooLong",
      "msg": "Name exceeds maximum length"
    },
    {
      "code": 6001,
      "name": "descriptionTooLong",
      "msg": "Description exceeds maximum length"
    },
    {
      "code": 6002,
      "name": "tooManyTags",
      "msg": "Too many tags"
    },
    {
      "code": 6003,
      "name": "tagTooLong",
      "msg": "Tag exceeds maximum length"
    },
    {
      "code": 6004,
      "name": "storageRefTooLong",
      "msg": "Storage reference exceeds maximum length"
    },
    {
      "code": 6005,
      "name": "nameHashMismatch",
      "msg": "Provided name_hash does not match sha256(name)"
    },
    {
      "code": 6006,
      "name": "invalidPrice",
      "msg": "Payment amount is below the listing price"
    },
    {
      "code": 6007,
      "name": "listingInactive",
      "msg": "Listing is not active"
    },
    {
      "code": 6008,
      "name": "sellerMismatch",
      "msg": "Seller account does not match the vault owner"
    },
    {
      "code": 6009,
      "name": "notForkable",
      "msg": "Only public vaults can be forked"
    }
  ],
  "types": [
    {
      "name": "accessGrant",
      "docs": [
        "On-chain record that `grantee` may access `vault`. Backends prove access by",
        "deriving and reading this PDA — no trust in an off-chain DB required."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "grantee",
            "type": "pubkey"
          },
          {
            "name": "permission",
            "type": {
              "defined": {
                "name": "permission"
              }
            }
          },
          {
            "name": "grantType",
            "type": {
              "defined": {
                "name": "grantType"
              }
            }
          },
          {
            "name": "expiry",
            "docs": [
              "Unix timestamp when access expires. 0 = never."
            ],
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "agentRegistry",
      "docs": [
        "\"Passport\" of an agent. One per wallet. Created on first use (register_agent)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "vaultCount",
            "docs": [
              "Quick per-agent counter of owned vaults (profile stat)."
            ],
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "category",
      "docs": [
        "Marketplace category for discovery filters."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "deFi"
          },
          {
            "name": "security"
          },
          {
            "name": "trading"
          },
          {
            "name": "general"
          }
        ]
      }
    },
    {
      "name": "grantType",
      "docs": [
        "How an AccessGrant was obtained."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "free"
          },
          {
            "name": "paid"
          }
        ]
      }
    },
    {
      "name": "memoryVault",
      "docs": [
        "The core account: a wallet-owned container of memory.",
        "",
        "Content of memory entries is NOT stored on-chain (too expensive). The chain",
        "holds only the proof + pointer: `merkle_root` (integrity) and `storage_ref`",
        "(where the content lives, DB-A now / Shadow Drive later)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "visibility",
            "type": {
              "defined": {
                "name": "visibility"
              }
            }
          },
          {
            "name": "tags",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "entryCount",
            "docs": [
              "Number of memory entries inside the vault."
            ],
            "type": "u32"
          },
          {
            "name": "merkleRoot",
            "docs": [
              "Merkle root over all entry hashes — the integrity primitive used by /verify."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "storageRef",
            "docs": [
              "Pointer to where the full content is stored off-chain."
            ],
            "type": "string"
          },
          {
            "name": "parent",
            "docs": [
              "If this vault is a fork, link to the parent vault (provenance)."
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "permission",
      "docs": [
        "Level of access an AccessGrant confers."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "read"
          },
          {
            "name": "write"
          },
          {
            "name": "admin"
          }
        ]
      }
    },
    {
      "name": "protocolConfig",
      "docs": [
        "Singleton protocol configuration. One per program. Created once by the admin."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Who may change protocol settings (admin / governance)."
            ],
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "docs": [
              "Where protocol fees are sent (used by the marketplace escrow split later)."
            ],
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "docs": [
              "Protocol fee in basis points (e.g. 500 = 5%)."
            ],
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vaultListing",
      "docs": [
        "Marketplace listing for a vault. One per vault."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "pricePerQuery",
            "docs": [
              "Price per query, in lamports (devnet-SOL for the MVP)."
            ],
            "type": "u64"
          },
          {
            "name": "previewCount",
            "docs": [
              "How many entries are shown for free as a preview."
            ],
            "type": "u8"
          },
          {
            "name": "category",
            "type": {
              "defined": {
                "name": "category"
              }
            }
          },
          {
            "name": "queryCount",
            "docs": [
              "Number of paid queries served (popularity)."
            ],
            "type": "u64"
          },
          {
            "name": "revenue",
            "docs": [
              "Total lamports earned from SOL payments."
            ],
            "type": "u64"
          },
          {
            "name": "tokenRevenue",
            "docs": [
              "Total token base units earned from $TOME payments (Model 2)."
            ],
            "type": "u64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "visibility",
      "docs": [
        "Who may read a vault."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "public"
          },
          {
            "name": "permissioned"
          },
          {
            "name": "private"
          }
        ]
      }
    }
  ]
};
