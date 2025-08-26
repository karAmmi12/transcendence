// schema creation TOURNAMENT
export const createTournamentSchema = {
    body: {
        type: 'object',
        required: ['participants'],
        properties: {
            participants: {
                type: 'array',
                items: {type: 'string'},
                minItems: 8,
                maxItems: 8
            },
            userId: {type: 'number'} //siuuu peut etre deja recup par middleware
        }
    }
};

export const matchFinishedSchema = {
    body: {
        type: 'object',
        required: ['winner', 'scores'],
        properties: {
            winner: {
                oneOf: [
                    {type: 'string'}, //alias
                    {type: 'number'} //userId
                ]
            },
            scores: {
                type: 'object',
                required: ['player1', 'player2'],
                properties: {
                    player1: {type: 'number'},
                    player2: {type: 'number'}
                }
            }
        }
    }
};