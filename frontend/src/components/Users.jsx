import { useEffect, useState } from "react";
import { Button } from "./Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Users = () => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("");

    useEffect(() => {
    axios.get("https://paylink-2.onrender.com/api/v1/user/bulk?filter=" + filter)
            .then(response => {
                setUsers(response.data.user);
            })
            .catch(err => {
                console.error("Error fetching users:", err);
            });
    }, [filter]);

    return (
        <>
            <div className="font-bold mt-6 text-lg">
                Users
            </div>
            <div className="my-2">
                <input 
                    onChange={(e) => setFilter(e.target.value)} 
                    type="text" 
                    placeholder="Search users..." 
                    className="w-full px-2 py-1 border rounded border-slate-200"
                />
            </div>
            <div>
                {users.map((user) => (
                    <User key={user._id} user={user} />
                ))}
            </div>
        </>
    );
}

function User({ user }) {
    const navigate = useNavigate();

    return (
        <div className="flex justify-between items-center p-2 border-b border-slate-100">
            <div className="flex items-center">
                <div className="rounded-full h-12 w-12 bg-slate-200 flex justify-center items-center mr-2 text-xl font-semibold">
                    {user.firstName[0]}
                </div>
                <div>
                    <div className="font-medium">
                        {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button 
                    onClick={() => navigate("/send?id=" + user._id + "&name=" + user.firstName)} 
                    label={"Send Money"} 
                />
                <Button 
                    onClick={() => navigate("/chat/" + user._id)} 
                    label={"Chat"} 
                />
            </div>
        </div>
    );
}
