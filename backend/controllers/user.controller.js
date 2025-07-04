import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

//models
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";


// export const getUserProfile = async (req, res) => {
// 	const { username } = req.params;

// 	try {
// 		// Fetch the user by username and exclude the password field
// 		const user = await User.findOne({ username }).select("-password");
// 		if (!user) {
// 			return res.status(404).json({ error: "User not found" });
// 		}

// 		// Return the user profile data as JSON
// 		res.status(200).json({ success: true, data: user });
// 	} catch (error) {
// 		console.error("Error in getUserProfile: ", error.message);
// 		res.status(500).json({ error: "Internal server error" });
// 	}
// };

export const getUserProfile = async (req, res) => {
	const { username } = req.params;

	try {
		// Fetch the user by username and exclude the password field
		const user = await User.findOne({ username }).select("-password");
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Return the user profile data as JSON
		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getUserProfile: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const followUnfollowUser =  async (req, res) => {
	try {
		const { id } = req.params; // User ID to follow/unfollow
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString()) {
			// Prevent following/unfollowing oneself
			return res.status(400).json({ error: "You cannot follow/unfollow yourself"});
		}
		if (!userToModify || !currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		const isFollowing =  currentUser.following.includes(id);

		if (isFollowing) {
			// Unfollow the user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id} });

			// TODO: return the id of the user as a response
			res.status(200).json({ message: "User unfollowed successfully" });

		} else {
			// Follow the user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id} });
			// Create a notification for the followed user
			const newNotification = new Notification({
				type: "follow",
				from: req.user._id,
				to: userToModify._id,

			});

			await newNotification.save();
			// TODO: return the id of the user as a response
			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (error) {
		console.log("Error in followUnfollowUser : ", error.message);
		res.status(500).json({ error: error.message });		
	}

}

export const getSuggestedUsers = async (req, res) => {
	try {
		const userId =  req.user._id;

		const usersFollowedByMe = await User.findById(userId).select("following");
		
		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId } // Exclude the current user
				}
			},
			{
				$sample: {
					size: 10 // Randomly select 10 users
				}
			}
		])
		// Filter out users that are already followed by the current user
		const filteredUsers = users.filter(user => !usersFollowedByMe.following.includes(user._id))
		const suggestedUsers = filteredUsers.slice(0, 4); // Limit to 4 users

		suggestedUsers.forEach(user => user.password = null); // Remove password field

		res.status(200).json(suggestedUsers);		
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message);
		res.status(500).json({ error: error.message });
		
	}
	 
	
}

export const updateUser =  async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body; 
	
	const userId =  req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current and new password" });
		}
		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) {
				return res.status(400).json({ error: "Current password is incorrect" });
			}
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "new password must be at least 6 characters long" });
			}
			const salt =  await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt); // Hash the new password
		}
		if (profileImg) {
			if (user.profileImg) {
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profileImg)
			profileImg = uploadedResponse.secure_url;
		
		}
		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}
			const uploadedResponse = await cloudinary.uploader.upload(coverImg)
			coverImg = uploadedResponse.secure_url;

		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		await user.save();

		user.password = null; // Remove password field before sending response

		return res.status(200).json(user);

	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
		
	}
}
