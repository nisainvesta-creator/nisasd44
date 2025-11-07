import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useWallet } from '../hooks/useWallet';
import { API_BASE_URL } from '../constants';

interface User {
  id: number;
  name?: string;
  email: string;
  wallet_address: string;
  is_active: boolean;
}

interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  tx_hash?: string;
}

interface Deposit {
  id: number;
  user_id: number;
  amount: number;
  tx_hash?: string;
  confirmed: boolean;
}

export const AdminPanel: React.FC = () => {
  const { user, token } = useWallet();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if user is admin (you might want to add an is_admin field to your user model)
  const isAdmin = user?.email?.includes('admin') || user?.id === 1; // Simple check for demo

  useEffect(() => {
    if (isAdmin && token) {
      fetchAdminData();
    }
  }, [isAdmin, token]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, depositsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/users/`, {
          headers: { 'Authorization': `Bearer ${token.access_token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/deposits/`, {
          headers: { 'Authorization': `Bearer ${token.access_token}` }
        })
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (depositsRes.ok) setDeposits(await depositsRes.json());
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeposit = async (depositId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/deposits/${depositId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmed: true })
      });

      if (response.ok) {
        alert('Deposit confirmed successfully');
        fetchAdminData(); // Refresh data
      } else {
        alert('Failed to confirm deposit');
      }
    } catch (error) {
      console.error('Confirm deposit error:', error);
      alert('Error confirming deposit');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p>You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{user.name || 'No name'}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.wallet_address}</p>
                        </div>
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transactions ({transactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="border rounded p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{tx.type} - {tx.amount} {tx.currency}</p>
                          <p className="text-sm text-gray-600">User ID: {tx.user_id}</p>
                          {tx.tx_hash && <p className="text-sm text-gray-500">Hash: {tx.tx_hash}</p>}
                        </div>
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded ${
                            tx.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>Deposits ({deposits.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="border rounded p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{deposit.amount} USDT</p>
                          <p className="text-sm text-gray-600">User ID: {deposit.user_id}</p>
                          {deposit.tx_hash && <p className="text-sm text-gray-500">Hash: {deposit.tx_hash}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            deposit.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {deposit.confirmed ? 'Confirmed' : 'Pending'}
                          </span>
                          {!deposit.confirmed && (
                            <Button
                              size="sm"
                              onClick={() => confirmDeposit(deposit.id)}
                            >
                              Confirm
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{users.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{transactions.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {deposits.filter(d => !d.confirmed).length}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
