import React, { useState } from 'react';

const incomeData = [
    { level: 'Lv1', usdt: '100-999', income: '0.8%-0.9%' },
    { level: 'Lv2', usdt: '999-4999', income: '1%-1.2%' },
    { level: 'Lv3', usdt: '4999-19999', income: '1.2%-1.4%' },
    { level: 'Lv4', usdt: '19999-49999', income: '1.5%-2%' },
    { level: 'Lv5', usdt: '49999-99999', income: '2.5%-2.9%' },
    { level: 'Lv6', usdt: '99999-499999', income: '3%-3.5%' },
    { level: 'Lv7', usdt: '499999-999999', income: '3.6%-4%' },
    { level: 'Lv8', usdt: '999999-9999999999', income: '4.5%-5%' },
];

export const IncomeTable: React.FC = () => (
    <div className="p-4 sm:p-7">
        <h3 className="text-black font-medium pb-4 text-lg"> Grading income</h3>
        <div className="table__wrapper">
            <table className="table-auto w-full border-separate border-spacing-y-2">
                <thead>
                    <tr className="text-black">
                        <th className="text-left uppercase text-xs font-semibold pb-3 pl-2">Level</th>
                        <th className="text-center uppercase text-xs font-semibold pb-3">usdt</th>
                        <th className="text-right uppercase text-xs font-semibold pb-3 pr-2">Income(%)</th>
                    </tr>
                </thead>
                <tbody>
                    {incomeData.map((row, index) => (
                        <tr key={index} className="text-black bg-white font-medium text-xs">
                            <td className="py-2 text-left rounded-md pl-2">{row.level}</td>
                            <td className="py-2 text-center">{row.usdt}</td>
                            <td className="py-2 text-right rounded-md pr-2">{row.income}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default IncomeTable;
