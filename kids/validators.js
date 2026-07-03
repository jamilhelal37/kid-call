import Joi from "joi";
import AppError from "../utils/app-error.js";

export function validateAddingKid(req, res, next){
    const full_name = req.body.full_name;
    const classroom = req.body.classroom;

    const schema = Joi.object({
        full_name: Joi.string().min(2).required(),
        classroom: Joi.string().min(2).max(3).required()
    });

    const {error} = schema.validate({
        full_name,
        classroom
    });

    if(error){
        const messages = error.details.map(d => d.message);
        console.log(messages);
        throw new AppError(messages.join(','), 400, error);
    }

    next();
}

export function validateGetKidsOf(req, res, next){
    const user_id = req.params.id;

    const schema = Joi.object({
        user_id: Joi.string().required()
    });

    const {error} = schema.validate({
        user_id
    });

    if(error){
        const messages = error.details.map(d => d.message);
        throw new AppError(messages.join(','), 400, error);
    }

    next();
}

export function validateCallKid(req, res, next) {
 
  const kid_id = req.params.id;
  const schema = Joi.object({
    kid_id: Joi.number().integer().positive().required(),
  });

  const { error } = schema.validate({ kid_id });

  if (error) {
    const messages = error.details.map((d) => d.message);
    throw new AppError(messages.join(","), 400, error);
  }

  next();
}