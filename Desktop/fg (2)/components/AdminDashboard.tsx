import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useAccount } from 'wagmi';
import { getAllUsersAdmin, updateUserBalance, notifyUserReward, getAdminDashboardStats, addBalanceByWalletAddress } from '../api';
import { API_BASE_URL } from '../constants';

interface User {
  id: number;
  wallet_address: string;
  email: string | null;
  username: string | null;
  is_active: boolean;
  is_admin: boolean;
  wallet_connected: boolean;
  wallet_balance: string;
  last_wallet_connection: string | null;
  created_at: string;
  updated_at: string | null;
}

interface DashboardStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_deposits: number;
  recent_deposits: number;
  system_health: string;
}

import BotControl from './BotControl';

const AdminDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardType, setRewardType] = useState('mining');
  const [rewardMessage, setRewardMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [walletAddressInput, setWalletAddressInput] = useState('');
  const [amountToAdd, setAmountToAdd] = useState('');
  const [addBalanceLoading, setAddBalanceLoading] = useState(false);
  const [audits, setAudits] = useState<any[]>([]);

  const loadAudits = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/audits/?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAudits(data);
      }
    } catch (e) {
      console.error('Failed to load audits', e);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      // Check if user is admin by making a request to get user info
      checkAdminStatus();
    }
  }, [isConnected, address]);

  const checkAdminStatus = async () => {
    try {
      // First get JWT token
      const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login?wallet_address=${address}`, {
        method: 'POST'
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        const jwtToken = loginData.access_token;
        setToken(jwtToken);

        // Check if user is admin
        const userResponse = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.is_admin) {
            setIsAdmin(true);
            loadDashboardData(jwtToken);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  const loadDashboardData = async (jwtToken?: string) => {
    const authToken = jwtToken || token;
    if (!authToken) return;

    try {
      setLoading(true);
      // Load stats and users
      const [statsResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/admin/users/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (userId: number) => {
    if (!balanceAmount || isNaN(parseFloat(balanceAmount))) {
      alert('Please enter a valid balance amount');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ balance: balanceAmount })
      });

      if (response.ok) {
        alert('Balance updated successfully!');
        loadDashboardData();
        setBalanceAmount('');
        setSelectedUser(null);
      } else {
        alert('Failed to update balance');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Error updating balance');
    }
  };

  const handleSendReward = async (userId: number) => {
    if (!rewardAmount || !rewardMessage) {
      alert('Please fill in all reward fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/notify-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reward_amount: rewardAmount,
          reward_type: rewardType,
          message: rewardMessage
        })
      });

      if (response.ok) {
        alert('Reward notification sent successfully!');
        setRewardAmount('');
        setRewardMessage('');
        setSelectedUser(null);
      } else {
        alert('Failed to send reward notification');
      }
    } catch (error) {
      console.error('Error sending reward:', error);
      alert('Error sending reward notification');
    }
  };

  const handleAddBalanceByAddress = async () => {
    if (!walletAddressInput.trim()) {
      alert('Please enter a wallet address');
      return;
    }

    if (!amountToAdd || isNaN(parseFloat(amountToAdd)) || parseFloat(amountToAdd) <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    setAddBalanceLoading(true);
    try {
      const result = await addBalanceByWalletAddress(
        walletAddressInput.trim(),
        parseFloat(amountToAdd),
        token!
      );

      alert(`Balance added successfully!\n\nUser ID: ${result.user_id}\nWallet: ${result.wallet_address}\nAmount Added: $${result.amount_added}\nNew Balance: $${result.new_balance}`);
      setWalletAddressInput('');
      setAmountToAdd('');
      loadDashboardData();
    } catch (error) {
      console.error('Error adding balance:', error);
      alert(`Failed to add balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAddBalanceLoading(false);
    }
  };

  // Render admin bot control and other admin panels
  const renderBotControl = () => {
    if (!isAdmin) return null;
    return (
      <div className="mb-6">
        <BotControl />
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">System management and user administration</p>
        </div>

        {renderBotControl()}

        <div className="flex items-center justify-end gap-2 mb-4">
          <Button onClick={async () => {
            if (!token) { alert('Not authenticated'); return; }
            try {
              const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/export`, { headers: { Authorization: `Bearer ${token}` } });
              if (!res.ok) { alert('Export failed'); return; }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'users.csv';
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (e) { console.error(e); alert('Export failed'); }
          }} variant="outline">Export Users CSV</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <div className="w-4 h-4 bg-green-500 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_deposits || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <div className="w-4 h-4 bg-green-500 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.system_health || 'Unknown'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="balances">Balance Control</TabsTrigger>
            <TabsTrigger value="add-balance">Add Balance</TabsTrigger>
            <TabsTrigger value="rewards">Reward Notifications</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all system users</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{user.username || 'No username'}</span>
                          {user.is_admin && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                          {!user.is_active && <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Inactive</span>}
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Wallet: {user.wallet_address.slice(0, 10)}...{user.wallet_address.slice(-8)}</p>
                          <p>Email: {user.email || 'Not provided'}</p>
                          <p>Balance: ${user.wallet_balance}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <span className="mr-2">⚙️</span>
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Control Tab */}
          <TabsContent value="balances" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance Control</CardTitle>
                <p className="text-sm text-muted-foreground">Update user wallet balances</p>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium mb-2">Update Balance for {selectedUser.username || selectedUser.wallet_address.slice(0, 10)}</h3>
                      <p className="text-sm text-gray-600 mb-4">Current Balance: ${selectedUser.wallet_balance}</p>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          placeholder="New balance"
                          value={balanceAmount}
                          onChange={(e) => setBalanceAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={() => handleUpdateBalance(selectedUser.id)}>
                          Update Balance
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedUser(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💰</span>
                    </div>
                    <p>Select a user from the User Management tab to update their balance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Balance by Address Tab */}
          <TabsContent value="add-balance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Balance by Wallet Address</CardTitle>
                <p className="text-sm text-muted-foreground">Add balance directly using wallet address</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="walletAddress">Wallet Address</Label>
                    <Input
                      id="walletAddress"
                      type="text"
                      placeholder="0x..."
                      value={walletAddressInput}
                      onChange={(e) => setWalletAddressInput(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amountToAdd">Amount to Add</Label>
                    <Input
                      id="amountToAdd"
                      type="number"
                      placeholder="20000"
                      value={amountToAdd}
                      onChange={(e) => setAmountToAdd(e.target.value)}
                      className="mt-1"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAddBalanceByAddress}
                      disabled={addBalanceLoading}
                      className="flex-1"
                    >
                      {addBalanceLoading ? 'Adding...' : 'Add Balance'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setWalletAddressInput('');
                        setAmountToAdd('');
                      }}
                      disabled={addBalanceLoading}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reward Notifications Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reward Notifications</CardTitle>
                <p className="text-sm text-muted-foreground">Send reward notifications to users</p>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-medium mb-2">Send Reward to {selectedUser.username || selectedUser.wallet_address.slice(0, 10)}</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="rewardAmount">Reward Amount</Label>
                          <Input
                            id="rewardAmount"
                            type="number"
                            placeholder="100.00"
                            value={rewardAmount}
                            onChange={(e) => setRewardAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="rewardType">Reward Type</Label>
                          <select
                            id="rewardType"
                            title="Reward Type"
                            className="w-full p-2 border rounded-md"
                            value={rewardType}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRewardType(e.target.value)}
                          >
                            <option value="mining">Mining</option>
                            <option value="referral">Referral</option>
                            <option value="bonus">Bonus</option>
                            <option value="staking">Staking</option>
                          </select>
                        </div>
                      </div>
                      <div className="mb-4">
                        <Label htmlFor="rewardMessage">Custom Message</Label>
                        <textarea
                          id="rewardMessage"
                          className="w-full p-2 border rounded-md resize-none"
                          placeholder="Congratulations! You've earned a reward..."
                          value={rewardMessage}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRewardMessage(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleSendReward(selectedUser.id)}>
                          <span className="mr-2">🔔</span>
                          Send Reward Notification
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedUser(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🎁</span>
                    </div>
                    <p>Select a user from the User Management tab to send reward notifications</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <p className="text-sm text-muted-foreground">Recent admin actions and system audits</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button onClick={() => loadAudits()} variant="outline" size="sm">Refresh Logs</Button>
                  <div className="mt-4 space-y-2">
                    {audits.length === 0 ? (
                      <div className="text-sm text-gray-500">No audits found</div>
                    ) : (
                      audits.map(a => (
                        <div key={a.id} className="p-3 border rounded-md bg-white">
                          <div className="text-sm text-gray-700">{new Date(a.created_at).toLocaleString()} — <span className="font-medium">{a.action}</span></div>
                          <div className="text-xs text-gray-500">Admin: {a.admin_id || 'N/A'} | User: {a.user_id || 'N/A'}</div>
                          <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(a.details)}</pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
