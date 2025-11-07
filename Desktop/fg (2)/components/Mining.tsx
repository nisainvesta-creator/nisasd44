"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useWallet } from "../hooks/useWallet"
import { useError } from "../hooks/useError"
import { useLanguage } from "../hooks/useLanguage"
import { TelegramService } from "../lib/telegram-service"
import TeamPage from "./TeamPage"
import type { MiningPoolData, UserMiningStats } from "../types"
import { apiRequest, hasBackend } from "../lib/apiClient"
import DepositModal from './DepositModal'

interface MiningProps {
  onBack: () => void
}

const offlineMiningPools: MiningPoolData[] = [
  {
    id: 1,
    name: "Starter Pool",
    token_symbol: "BNB",
    reward_rate: "0.35",
    total_staked: "1,250,000",
    apy: "12.5",
    is_active: true,
    user_staked: "0",
    user_rewards: "0",
  },
  {
    id: 2,
    name: "Growth Pool",
    token_symbol: "USDT",
    reward_rate: "0.85",
    total_staked: "2,480,000",
    apy: "18.0",
    is_active: true,
    user_staked: "0",
    user_rewards: "0",
  },
  {
    id: 3,
    name: "Velocity Pool",
    token_symbol: "BNB",
    reward_rate: "1.20",
    total_staked: "980,000",
    apy: "24.0",
    is_active: false,
    user_staked: "0",
    user_rewards: "0",
  },
]

const offlineUserStats: UserMiningStats = {
  total_staked: "0",
  total_rewards: "0",
  active_pools: offlineMiningPools.filter((pool) => pool.is_active).length,
  daily_earnings: "0",
}

const offlineBonusTemplate = {
  welcomeBonus: 50,
  depositBonus: 20,
  referralBonus: 15,
  tradeRebate: 8,
  totalVolume: 0,
  netDeposit: 0,
  referralCount: 0,
}

const Mining: React.FC<MiningProps> = ({ onBack }) => {
  const [miningPools, setMiningPools] = useState<MiningPoolData[]>([])
  const [userStats, setUserStats] = useState<UserMiningStats | null>(null)
  const [selectedPool, setSelectedPool] = useState<MiningPoolData | null>(null)
  const [stakeAmount, setStakeAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("pools")
  const [bonusInfo, setBonusInfo] = useState({
    welcomeBonus: 0,
    depositBonus: 0,
    referralBonus: 0,
    tradeRebate: 0,
    totalVolume: 0,
    netDeposit: 0,
    referralCount: 0,
  })

  const { isConnected, walletAddress, primaryWallet } = useWallet()

  // Team/invite data derived from user stats if available
  const teamMembers = (userStats && (userStats as any).team_members) || []
  const teamTotalRevenue = (userStats && (userStats as any).team_revenue) || 0

  const handleSetCurrentPage = (page: string) => {
    if (page === "Mine") onBack()
    else console.log("Navigate to", page)
  }
  const { showError } = useError()
  const { t } = useLanguage()

  const hasInsufficientBalance = () => {
    if (!primaryWallet || !primaryWallet.tokens) return true

    const bnbBalance = primaryWallet.tokens.find((token) => token.symbol === "BNB")?.balance || 0
    const usdtBalance = primaryWallet.tokens.find((token) => token.symbol === "USDT")?.balance || 0

    return bnbBalance < 0.001 && usdtBalance < 0.001
  }

  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchMiningData()
      const interval = setInterval(fetchMiningData, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, walletAddress])

  const fetchMiningData = async () => {
    if (!hasBackend) {
      setMiningPools(offlineMiningPools.map((pool) => ({ ...pool })))
      setUserStats({ ...offlineUserStats })
      setBonusInfo({ ...offlineBonusTemplate })
      return
    }

    try {
      const pools = await apiRequest<MiningPoolData[]>(`/mining/pools${walletAddress ? `?address=${walletAddress}` : ""}`)
      setMiningPools(pools)

      if (walletAddress) {
        const stats = await apiRequest<UserMiningStats>(`/mining/user-stats?address=${walletAddress}`)
        setUserStats(stats)

        const bonus = await apiRequest<typeof bonusInfo>(`/mining/bonus-stats?address=${walletAddress}`)
        setBonusInfo(bonus)
      }
    } catch (error) {
      console.error("Failed to fetch mining data:", error)
    }
  }

  const handleStake = async (poolId: number) => {
    if (!isConnected || !walletAddress) {
      showError("Please connect your wallet first")
      return
    }

    if (hasInsufficientBalance()) {
      showError("Insufficient balance. Please deposit funds to your wallet before mining.")
      return
    }

    if (!stakeAmount || Number.parseFloat(stakeAmount) <= 0) {
      showError("Please enter a valid stake amount")
      return
    }

    if (!hasBackend) {
      showError("Staking requires a backend connection.")
      return
    }

    setIsLoading(true)
    try {
      await apiRequest(`/mining/stake`, {
        method: "POST",
        body: {
          poolId,
          amount: stakeAmount,
          walletAddress: walletAddress,
        },
      })

      setStakeAmount("")
      setSelectedPool(null)
      fetchMiningData()

      await TelegramService.notifyMiningActivity(
        walletAddress,
        `staked ${stakeAmount} tokens in ${selectedPool?.name || "mining pool"}`,
        Number.parseFloat(stakeAmount),
      )
    } catch (error) {
      showError("Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const [showDepositModal, setShowDepositModal] = useState(false)

  const handleClaimRewards = async (poolId: number) => {
    if (!isConnected || !walletAddress) return

    if (!hasBackend) {
      showError("Reward claims require a backend connection.")
      return
    }

    setIsLoading(true)
    try {
      await apiRequest(`/mining/claim-rewards`, {
        method: "POST",
        body: {
          poolId,
          walletAddress: walletAddress,
        },
      })

      fetchMiningData()

      const pool = miningPools.find((p) => p.id === poolId)
      const rewardAmount = pool?.user_rewards ? Number.parseFloat(pool.user_rewards) : 0
      await TelegramService.notifyRewardsActivity(
        walletAddress,
        rewardAmount,
        `claimed from ${pool?.name || "mining pool"}`,
      )
    } catch (error) {
      showError("Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Connect Wallet Required</h2>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to access mining features and start earning rewards
              </p>
              <Button onClick={onBack} variant="outline" className="w-full bg-transparent">
                Go Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="p-2 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <div className="flex items-center gap-3">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/design-mode-images/1839-tbwPy0Azax45izC0MO4AGEp3UKCKp7.png"
                  alt="BNB AI"
                  className="w-8 h-8 rounded-full"
                />
                <h1 className="text-2xl font-bold text-gray-900">Mining Dashboard</h1>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              🟢 Live Data
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {hasInsufficientBalance() && (
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Insufficient Balance</h3>
                  <p className="text-sm text-red-700">
                    You need to deposit funds to your wallet before you can start mining.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-yellow-600">🎁</span>
              Event Bonuses & Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{bonusInfo.welcomeBonus} USDT</div>
                <div className="text-sm text-muted-foreground">Welcome Bonus</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{bonusInfo.depositBonus} USDT</div>
                <div className="text-sm text-muted-foreground">Deposit Bonus (20%)</div>
                <div className="text-xs text-muted-foreground">Net: {bonusInfo.netDeposit} USDT</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{bonusInfo.referralBonus} USDT</div>
                <div className="text-sm text-muted-foreground">Referral Bonus</div>
                <div className="text-xs text-muted-foreground">{bonusInfo.referralCount} referrals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{bonusInfo.tradeRebate} USDT</div>
                <div className="text-sm text-muted-foreground">Trade Rebate (20%)</div>
                <div className="text-xs text-muted-foreground">Volume: {bonusInfo.totalVolume} USDT</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <div className="text-sm text-yellow-800">
                <strong>Event Rules:</strong> KYC required • Max 1,000 USDT deposit bonus • 10 USDT per referral •
                20,000 USDT max rebate • Rewards distributed within 7 days
              </div>
            </div>
          </CardContent>
        </Card>

        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Staked</div>
                <div className="text-2xl font-bold">{userStats.total_staked} CLAM</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Rewards</div>
                <div className="text-2xl font-bold text-green-600">{userStats.total_rewards} CLAM</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Active Pools</div>
                <div className="text-2xl font-bold">{userStats.active_pools}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Daily Earnings</div>
                <div className="text-2xl font-bold text-blue-600">{userStats.daily_earnings} CLAM</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pools">Mining Pools</TabsTrigger>
            <TabsTrigger value="positions">My Positions</TabsTrigger>
            <TabsTrigger value="bonuses">Event Bonuses</TabsTrigger>
            <TabsTrigger value="levels">VIP Levels</TabsTrigger>
            <TabsTrigger value="team">Invite / Team</TabsTrigger>
          </TabsList>

          <TabsContent value="pools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {miningPools.map((pool) => (
                <Card key={pool.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pool.name}</CardTitle>
                      <Badge variant={pool.is_active ? "default" : "secondary"}>
                        {pool.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">APY</div>
                        <div className="font-semibold text-green-600">{pool.apy}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Staked</div>
                        <div className="font-semibold">
                          {Number.parseFloat(pool.total_staked).toLocaleString()} {pool.token_symbol}
                        </div>
                      </div>
                    </div>

                    {pool.user_staked && Number.parseFloat(pool.user_staked) > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-muted-foreground">Your Stake</div>
                        <div className="font-semibold">
                          {pool.user_staked} {pool.token_symbol}
                        </div>
                        {pool.user_rewards && (
                          <div className="text-sm text-green-600">
                            Rewards: {pool.user_rewards} {pool.token_symbol}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {hasInsufficientBalance() ? (
                        <>
                          <Button onClick={() => setShowDepositModal(true)} className="flex-1" variant="outline">
                            Deposit
                          </Button>
                          <Button className="flex-1" disabled>
                            Stake
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => setSelectedPool(pool)}
                            className="flex-1"
                            disabled={!pool.is_active}
                            title={!pool.is_active ? "Pool is inactive" : ""}
                          >
                            Stake
                          </Button>
                          {pool.user_rewards && Number.parseFloat(pool.user_rewards) > 0 ? (
                            <Button onClick={() => handleClaimRewards(pool.id)} variant="outline" disabled={isLoading}>
                              Claim
                            </Button>
                          ) : (
                            <div className="flex-1" />
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Mining Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {miningPools.filter((pool) => pool.user_staked && Number.parseFloat(pool.user_staked) > 0).length ===
                  0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active mining positions. Start by staking in a pool.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {miningPools
                      .filter((pool) => pool.user_staked && Number.parseFloat(pool.user_staked) > 0)
                      .map((pool) => (
                        <div key={pool.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{pool.name}</h3>
                            <Badge>{pool.apy}% APY</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Staked Amount</div>
                              <div className="font-semibold">
                                {pool.user_staked} {pool.token_symbol}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Pending Rewards</div>
                              <div className="font-semibold text-green-600">
                                {pool.user_rewards || "0"} {pool.token_symbol}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Daily Rate</div>
                              <div className="font-semibold">
                                {pool.reward_rate} {pool.token_symbol}
                              </div>
                            </div>
                            <div className="flex items-end">
                              {pool.user_rewards && Number.parseFloat(pool.user_rewards) > 0 && (
                                <Button size="sm" onClick={() => handleClaimRewards(pool.id)} disabled={isLoading}>
                                  Claim Rewards
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

          <TabsContent value="bonuses" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Bonus Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Deposit Bonus Progress</span>
                        <span>{bonusInfo.netDeposit}/200 USDT</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((bonusInfo.netDeposit / 200) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Trade Rebate Progress</span>
                        <span>{bonusInfo.totalVolume}/50,000 USDT</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${Math.min((bonusInfo.totalVolume / 50000) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📋 Bonus Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <strong>Welcome Bonus:</strong> 10 USDT for new users with KYC
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <strong>Deposit Bonus:</strong> 20% on deposits ≥200 USDT (max 1,000 USDT)
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <strong>Referral Bonus:</strong> 10 USDT per friend (≥2,000 USDT trading)
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <strong>Trade Rebate:</strong> 20% fee rebate on ≥50,000 USDT volume
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="levels" className="space-y-4">
            <div className="rate-table-tr">
              {[
                { level: "Lv1", usdt: "100-999", income: "1.9%-2.2%" },
                { level: "Lv2", usdt: "999-4999", income: "2.3%-2.7%" },
                { level: "Lv3", usdt: "4999-19999", income: "2.9%-3.4%" },
                { level: "Lv4", usdt: "19999-49999", income: "3.5%-4.1%" },
                { level: "Lv5", usdt: "49999-99999", income: "4.2%-4.8%" },
                { level: "Lv6", usdt: "99999-499999", income: "5%-5.7%" },
                { level: "Lv7", usdt: "499999-999999", income: "5.9%-6.6%" },
                { level: "Lv8", usdt: "999999+", income: "6.9%-7.6%" }
              ].map((row, index) => (
                <div key={index} className="rate-table-content grading-table-row" >
                  <div className="rate-table-line grading-cell">{row.level}</div>
                  <div className="rate-table-line grading-cell">{row.usdt}</div>
                  <div className="rate-table-line grading-cell">{row.income}</div>
                </div>
              ))}
            </div>
            <div className="btn-area grading-btn-area">
              <div className="grading-confirm-btn" onClick={() => setActiveTab("pools")} >
                Confirm
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamPage setCurrentPage={handleSetCurrentPage} teamMembers={teamMembers} teamTotalRevenue={teamTotalRevenue} />
          </TabsContent>
        </Tabs>
      </div>

      {selectedPool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Stake in {selectedPool.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stakeAmount">Amount to Stake</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="stakeAmount"
                    type="number"
                    placeholder="0.00"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    const usdtBal = (primaryWallet?.tokens?.find(t => t.symbol === 'USDT')?.balance) || 0
                    setStakeAmount(Number.isFinite(usdtBal) ? Number.parseFloat(String(usdtBal)).toFixed(2) : String(usdtBal))
                  }}>
                    Max
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  APY: {selectedPool.apy}% | Token: {selectedPool.token_symbol}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStake(selectedPool.id)}
                  disabled={isLoading || !stakeAmount}
                  className="flex-1"
                >
                  {isLoading ? "Staking..." : "Stake"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedPool(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} defaultUsd={10} />
    </div>
  )
}

export default Mining
