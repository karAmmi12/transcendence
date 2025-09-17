//schema REGISTER
export const registerSchema = {
    body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
            username: {
                type: 'string',
                minLength: 3,
                maxLength: 20,
                pattern: '^[a-zA-Z0-9_]+$'
            },
            email: {
                type: 'string',
                format: 'email',
                maxLength: 255
            },
            password: {
                type: 'string',
                minLength: 8,
                // Regex pour: 1 maj, 1 min, 1 chiffre, 1 spécial
                pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]' // 1 maj, 1 min, 1 chiffre, 1 spécial
            }
        },
        additionalProperties: false
    },
    response: {
        201: {
            type: 'object',
            properties: {
                message: {type: 'string'},
                user: {
                    type: 'object',
                    properties: {
                        id: {type: 'number'},
                        username: {type: 'string'},
                        email: {type: 'string'},
                        createdAt: {type: 'string'}
                    }
                }
                // token: {type: 'string'}
            }
        },
        400: {
            type: 'object',
            properties: {
                error: {type:'string'},
                // errors: {type: 'array'}
            }
        }
    }
};

//schema LOGIN
export const loginSchema = {
    body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
            username: {
                type: 'string',
                minLength: 1
            },
            password: {
                type: 'string',
                minLength: 1
            }
        },
        additionalProperties: false
    },
    response: {
        200: {
            type: 'object',
            properties: {
                message: {type: 'string'},
                user: {
                    type: 'object',
                    properties: {
                        id: {type: 'number'},
                        username: {type: 'string'},
                        email: {type: 'string'},
                        lastLogin: {type: 'string'}
                    }
                }
            }
        },
        401: {
            type: 'object',
            properties: {
                error: {type: 'string'}
            }
        }
    }
};

//schema UPDATE
export const updateProfileSchema = {
    body: {
        type: 'object',
        properties: {
            username: {
                type: 'string',
                minLength: 3,
                maxLength: 20,
                pattern: '^[a-zA-Z0-9_]+$'
            },
            email: {
                type: 'string',
                format: 'email',
                maxLength: 255
            },
            avatar_url: {
                type: 'string',
                maxLength: 500,
            }
        },
        additionalProperties: false,
        minProperties: 1
    },
    response: {
        200: {
            type: 'object',
            properties: {
                message: {type: 'string'},
                user: {
                    type: 'object',
                    properties: {
                        id: {type: 'number'},
                        username: {type: 'string'},
                        email: {type: 'string'},
                        avatar_url: {type: ['string', 'null']}
                    }
                }
            }
        },
        400: {
            type: 'object',
            properties: {
                error: {type:'string'},
            }
        }
    }
};