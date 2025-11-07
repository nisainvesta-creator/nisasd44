import React, { useState, useEffect } from 'react';
import { useAccount } from '../lib/wagmi-shim';
import { fetchTeamData } from '../api';
import { TeamData } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { ClipboardIcon, ClipboardDocumentListIcon, BNBIcon } from './Icons';

const useCopyToClipboard = (timeout = 2000) => {
    const [isCopied, setIsCopied] = useState(false);
    const { t } = useLanguage();

    const copy = (text: string) => {
        if (isCopied) return;
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), timeout);
        });
    };

    return { isCopied, copy, copiedText: t('team.copied'), copyText: t('team.copy') };
};

const InfoCard: React.FC<{ walletAddress: string | undefined }> = ({ walletAddress }) => {
    const { t } = useLanguage();
    const { isCopied: isAddressCopied, copy: copyAddress, copiedText: addressCopiedText, copyText: addressCopyText } = useCopyToClipboard();
    const { isCopied: isLinkCopied, copy: copyLink, copiedText: linkCopiedText, copyText: linkCopyText } = useCopyToClipboard();
    
    const referralLink = walletAddress ? `${window.location.origin}?ref=${walletAddress}` : '';

    const truncate = (text: string | undefined, start = 6, end = 4) => {
        if (!text) return '';
        return `${text.substring(0, start)}...${text.substring(text.length - end)}`;
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
            <div>
                <label className="text-xs text-gray-500">{t('team.myAddress')}</label>
                <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm text-gray-700 truncate">{truncate(walletAddress)}</p>
                    <button onClick={() => copyAddress(walletAddress || '')} className="text-sm text-blue-600 font-semibold flex items-center space-x-1">
                        <ClipboardIcon className="w-4 h-4" />
                        <span>{isAddressCopied ? addressCopiedText : addressCopyText}</span>
                    </button>
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-500">{t('team.myReferralLink')}</label>
                 <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm text-gray-700 truncate">{truncate(referralLink, 25, 15)}</p>
                    <button onClick={() => copyLink(referralLink)} className="text-sm text-blue-600 font-semibold flex items-center space-x-1">
                        <ClipboardIcon className="w-4 h-4" />
                        <span>{isLinkCopied ? linkCopiedText : linkCopyText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatGrid: React.FC<{ data: TeamData }> = ({ data }) => {
    const { t } = useLanguage();
    const stats = [
        { label: t('team.totalTeamSize'), value: data.totalTeamSize.toLocaleString() },
        { label: t('team.validMembers'), value: data.validMembers.toLocaleString() },
        { label: t('team.totalCommission'), value: data.totalCommission.toFixed(8), isBnb: true },
    ];

    return (
        <div className="grid grid-cols-3 gap-2 text-center">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-3 flex flex-col justify-center items-center">
                    <div className="text-sm font-semibold text-gray-800 flex items-center justify-center space-x-1">
                        <span>{stat.value}</span>
                        {stat.isBnb && <BNBIcon className="w-4 h-4" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
            ))}
        </div>
    );
};

const TeamSkeleton: React.FC = () => (
    <div className="p-4 space-y-4 animate-pulse">
        <div className="bg-gray-200 rounded-lg h-24"></div>
        <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-200 rounded-lg h-16"></div>
            <div className="bg-gray-200 rounded-lg h-16"></div>
            <div className="bg-gray-200 rounded-lg h-16"></div>
        </div>
        <div className="bg-gray-200 rounded-lg h-48"></div>
    </div>
);

const Team: React.FC = () => {
    const { address: walletAddress, isConnected } = useAccount();
    const { t } = useLanguage();
    const [teamData, setTeamData] = useState<TeamData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTeamData = async () => {
            if (walletAddress) {
                setIsLoading(true);
                try {
                    const data = await fetchTeamData(walletAddress);
                    setTeamData(data);
                } catch (error) {
                    console.error("Failed to fetch team data:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setTeamData(null);
                setIsLoading(false);
            }
        };

        loadTeamData();
    }, [walletAddress]);

    if (!isConnected) {
        return (
            <div className="text-center py-20 text-gray-500">
                <ClipboardDocumentListIcon className="mx-auto w-16 h-16 text-gray-300" />
                <p className="mt-4 text-sm">{t('team.connectWalletPrompt')}</p>
            </div>
        );
    }
    
    if (isLoading) {
        return <TeamSkeleton />;
    }

    if (!teamData || teamData.members.length === 0) {
        return (
            <div className="p-4 space-y-4">
                <InfoCard walletAddress={walletAddress} />
                <StatGrid data={{ totalTeamSize: 0, validMembers: 0, totalCommission: 0, members: [] }} />
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="font-bold text-gray-800 mb-2">{t('team.teamMembers')}</h3>
                    <div className="text-center py-10 text-gray-500">
                        <ClipboardDocumentListIcon className="mx-auto w-12 h-12 text-gray-300" />
                        <p className="mt-2 text-sm">{t('team.noTeamMembers')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
            <InfoCard walletAddress={walletAddress} />
            <StatGrid data={teamData} />
            <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-bold text-gray-800 mb-2">{t('team.teamMembers')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-2">{t('team.address')}</th>
                                <th scope="col" className="px-4 py-2 text-right">{t('team.registrationDate')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamData.members.map((member, index) => (
                                <tr key={index} className="border-b last:border-b-0">
                                    <td className="px-4 py-3 font-mono text-gray-700">{member.address}</td>
                                    <td className="px-4 py-3 text-gray-600 text-right">{member.registrationDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Team;
