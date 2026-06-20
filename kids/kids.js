import createSupabaseClient from "../utils/create-supabase-client.js";

export async function addKid(req, res, next) {
    const full_name = req.body.full_name;
    const user_id = req.body.user_id ?? req.user.id;
    const classroom = req.body.classroom;
    const is_confirmed = req.user.role === 'admin';

    const client = await createSupabaseClient();

    const {error} = await client.from('kids').insert({
        full_name,
        user_id,
        classroom,
        is_confirmed
    });

    if(error){
        return res.status(500).send(error);
    }

    return res.sendStatus(200);
}

export async function getKidsOf(req, res, next) {
    const client = await createSupabaseClient();
    const user_id = req.params.id;

    const { data, error } = await client.from("kids").select("*").eq("user_id", user_id);

    if(error){
        return res.status(500).send(error);
    }

    res.send(data);
}

export async function getAllKids(req, res, next) {
    if(req.user.role !== 'admin') {
        return res.send(403).send("You are not allowed to access this resource");
    }

    const client = await createSupabaseClient();

    const { data, error } = await client.from("kids").select("*");

    if(error){
        return res.status(500).send(error);
    }

    res.send(data);
}

export async function callKid(req, res, next) {
    
}