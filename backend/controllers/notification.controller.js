import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ to: userId })
        .populate({
            path: "from",
            select: "username profileImg"
        })

        await Notification.updateMany({ to: userId }, { $set: { isRead: true } });

        // if (!notifications) return res.status(404).json({ message: "No new notifications" });

        res.status(200).json(notifications);


    } catch (error) {
        console.log("Error in getNotifications controller:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }

}


export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await Notification.deleteMany({ to: userId });

        res.status(200).json({ message: "Notifications deleted successfully" });
    
        
    } catch (error) {
        console.log("Error in deleteNotifications controller:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
        
    }

}

// export const deleteNotification =  async (req, res) => {
//     const notificationId = req.params.id;
//     const userId = req.user._id;

//     try {
//         const notification = await Notification.findById(notificationId);
//         if (!notification) return res.status(404).json({ message: "Notification not found" });

//         if (notification.to.toString() !== userId.toString()) return res.status(403).json({ message: "You are not authorized to delete this notification" });
        
//         await Notification.findByIdAndDelete(notificationId);

//         res.status(200).json({ message: "Notification deleted successfully" });
 
//     } catch (error) {
//         console.log("Error in deleteNotification controller:", error.message);
//         res.status(500).json({ error: "Internal Server Error" });
        
//     }
// }