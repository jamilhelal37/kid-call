import AppError from "../utils/app-error.js";
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
        throw new AppError("Could not add kid", 500, error);
    }

    return res.sendStatus(200);
}

export async function getKidsOf(req, res, next) {
    const client = await createSupabaseClient();
    const user_id = req.params.id;

    const { data, error } = await client.from("kids").select("*").eq("user_id", user_id);

    if(error){
        throw new AppError("Could not getting kids", 500, error);
    }

    res.send(data);
}

export async function getAllKids(req, res, next) {
    if(req.user.role !== 'admin') {
        throw new AppError("You are not allowed to access this resource", 403, error);
    }

    const client = await createSupabaseClient();

    const { data, error } = await client.from("kids").select("*");

    if(error){
        throw new AppError("Could not getting all kids", 500, error);
    }

    res.send(data);
}

export async function callKid(req, res, next) {

    const kid_id  = Number(req.params.id);
    const user_id =  req.user.id;

    const client = await createSupabaseClient();

    const { data :kid, error :kidError} = await client
    .from("kids")
    .select("*")
    .eq("id", kid_id)
    .single();
    

    if (kidError) {
     throw new AppError("Kid not found", 404, kidError);
    }

    if (kid.user_id !== user_id) {
        throw new AppError("Kid does not belong to this user", 400);
    }
    
     const {data,error:callError} = await client.from('calls').insert({
        kid_id,
        user_id
    }).select("*").single();

    if(callError){
        throw new AppError("Could not add call", 500, callError);
    }
    
     const {error: callLogError} = await client.from('call_logs').insert({
        kid_id,
        user_id
    });

    if(callLogError){
        throw new AppError("Could not add call log", 500, callLogError);
    }

    return res.status(201).send(data);
    
}