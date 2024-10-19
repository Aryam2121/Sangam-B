// import Role from '../models/roles.model.js';

// // Create a new role
// export const createRole = async (req, res) => {
//     try {
//         const role = new Role(req.body);
//         await role.save();
//         res.status(201).json(role);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };

// // Fetch all roles
// export const getRoles = async (req, res) => {
//     try {
//         const roles = await Role.find();
//         res.status(200).json(roles);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };
