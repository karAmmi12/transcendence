import {fastify} from fastify

fastify.get('/login/is-connected', async(request, reply) =>{
    const prout;

    prout = await fastify.database.get('SELECT * FROM user WHERE email = ? ', request.email)

    if (prout)
    reply.status(200).send({success : true})
})