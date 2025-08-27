import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Appbar } from "../components/Appbar";
import { Balance } from "../components/Balance";
import { Users } from "../components/Users";

const API = "http://localhost:3006/api/v1";

const Home = ({ user, balance, loadingUser, loadingBalance }) => {
  const hours = new Date().getHours();
  const greeting =
    hours < 12
      ? "Good Morning"
      : hours < 18
      ? "Good Afternoon"
      : "Good Evening";


  const actions = [
    { icon: "💸", label: "Send Money" },
    { icon: "📥", label: "Deposit" },
    { icon: "⚡", label: "Recharge" },
    { icon: "🏦", label: "Bank Transfer" },
  ];
  return (
    <div className="px-6 py-8 space-y-8">
      {/* Greeting and Tagline */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          {loadingUser ? "Loading..." : `${greeting}, ${user?.firstName || ""} 👋`}
        </h1>
        <p className="text-purple-600 font-semibold text-lg mb-2">
          Fast, Secure & Easy Money Transfers
        </p>
        <p className="text-gray-500">
          With PayLink, you can send and receive money instantly, keep track of your balance, and manage transactions effortlessly.
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-8 rounded-3xl shadow-xl max-w-md mx-auto">
        <div className="text-lg font-medium">Your Balance</div>
        <div className="text-4xl font-extrabold mt-2">
          {loadingBalance ? "Loading..." : `₹ ${balance?.toLocaleString() ?? 0}`}
        </div>
      </div>
        {/* Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto p-7">
        {actions.map((action) => (
          <div
            key={action.label}
            className="flex flex-col items-center justify-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition cursor-pointer hover:scale-105"
          >
            <div className="text-4xl">{action.icon}</div>
            <div className="mt-3 font-semibold text-gray-700">{action.label}</div>
          </div>
        ))}
      </div>
     
    </div>
  );
};



const Transactions = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/transactions/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) setTransactions(res.data.transactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-gray-500">
        Loading transactions...
      </div>
    );

  if (!transactions.length)
    return (
      <div className="flex justify-center items-center py-10 text-gray-400">
        No transactions yet.
      </div>
    );

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Your Transactions
      </h2>

      <ul className="space-y-3">
        {transactions.map((tx) => (
          <li
            key={tx._id}
            className="flex justify-between items-center bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
          >
            {/* Left section: Type + Description + Date */}
            <div>
              <div
                className={`font-semibold ${
                  tx.type === "credit" ? "text-green-600" : "text-red-600"
                }`}
              >
                {tx.type === "credit" ? "💰 Received" : "📤 Sent"}
              </div>
              {tx.description && (
                <div className="text-gray-700 text-sm">{tx.description}</div>
              )}
              <div className="text-gray-400 text-xs mt-1">
                {new Date(tx.date).toLocaleString()}
              </div>
            </div>

            {/* Right section: Amount */}
            <div
              className={`text-lg font-bold ${
                tx.type === "credit" ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹{tx.amount}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Transactions;

const Deposit = ({ user, onBalanceUpdate }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDeposit = async () => {
    setError("");
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/bank/deposit`,
        { amount: Number(amount), description: "Bank deposit" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSuccess(true);
        onBalanceUpdate(res.data.balance);
        setAmount("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto border p-6 rounded-lg shadow-lg bg-white">
      {!success ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center">Deposit Money</h2>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full p-2 border rounded mb-4"
          />
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <button
            onClick={handleDeposit}
            disabled={loading}
            className={`w-full p-2 rounded ${
              loading ? "bg-gray-400" : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {loading ? "Processing..." : "Deposit"}
          </button>
        </>
      ) : (
        <p className="text-green-600 text-center font-semibold">
          Deposit Successful!
        </p>
      )}
    </div>
  );
};

const P2PTransfer = ({ balance, loadingBalance }) => (
  <div>
    {loadingBalance ? (
      <div>Loading balance...</div>
    ) : (
      <Balance value={balance?.toLocaleString()} />
    )}
    <Users />
  </div>
);

export const Dashboard = () => {
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const navigate = useNavigate();

  const fetchUser = async (token) => {
    try {
      const res = await axios.get(`${API}/profile/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/signin");
      }
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchBalance = async (token) => {
    try {
      const res = await axios.get(`${API}/account/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance);
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/signin");
      }
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/signin");

    fetchUser(token);
    fetchBalance(token);
  }, [navigate]);

  const handleBalanceUpdate = (newBalance) => setBalance(newBalance);

  return (
    <div className="h-screen flex flex-col">
      <Appbar user={user} />

      <div className="flex flex-1">
        <div className="w-56 bg-gray-100 p-6">
          <ul className="space-y-6 text-gray-700">
            <li
              className={`flex items-center space-x-3 cursor-pointer hover:text-purple-600 ${
                selectedMenu === "home" && "text-purple-600 font-medium"
              }`}
              onClick={() => setSelectedMenu("home")}
            >
              <span>🏠</span>
              <span>Home</span>
            </li>
            <li
              className={`flex items-center space-x-3 cursor-pointer hover:text-purple-600 ${
                selectedMenu === "p2p" && "text-purple-600 font-medium"
              }`}
              onClick={() => setSelectedMenu("p2p")}
            >
              <span>📈</span>
              <span>P2P Transfer</span>
            </li>
            <li
              className={`flex items-center space-x-3 cursor-pointer hover:text-purple-600 ${
                selectedMenu === "transactions" && "text-purple-600 font-medium"
              }`}
              onClick={() => setSelectedMenu("transactions")}
            >
              <span>⏰</span>
              <span>Transactions</span>
            </li>
            <li
              className={`flex items-center space-x-3 cursor-pointer hover:text-purple-600 ${
                selectedMenu === "deposit" && "text-purple-600 font-medium"
              }`}
              onClick={() => setSelectedMenu("deposit")}
            >
              <span>💵</span>
              <span>Deposit</span>
            </li>
          </ul>
        </div>

        <div className="flex-1 p-8">
          {selectedMenu === "home" && (
            <Home
              user={user}
              balance={balance}
              loadingUser={loadingUser}
              loadingBalance={loadingBalance}
            />
          )}
          {selectedMenu === "p2p" && (
            <P2PTransfer balance={balance} loadingBalance={loadingBalance} />
          )}
          {selectedMenu === "transactions" && <Transactions user={user} />}
          {selectedMenu === "deposit" && (
            <Deposit user={user} onBalanceUpdate={handleBalanceUpdate} />
          )}
        </div>
      </div>
    </div>
  );
};
