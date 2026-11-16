'use client';

import React from 'react';

export const MiniCalendar: React.FC = () => {
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Matching the exact dates and layout from the reference image:
  // S  M  T  W  T  F  S
  //    2  3  4  5  6  7  8  9
  // 10 11 12 13 14 15 16
  // 17 18 19 20 21 22 23
  const row1 = ['', '2', '3', '4', '5', '6', '7', '8', '9']; // Note: image shows days 2-9
  const row2 = ['10', '11', '12', '13', '14', '15', '16'];
  const row3 = ['17', '18', '19', '20', '21', '22', '23'];

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-3">
        Calendar
      </h3>

      <div className="flex-1 flex flex-col justify-center">
        {/* Days Header */}
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 mb-2">
          {daysOfWeek.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        {/* Date Rows */}
        <div className="space-y-1.5 text-center text-xs text-slate-600 font-medium">
          <div className="grid grid-cols-7 gap-1">
            <span />
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            <span>8</span>
            <span>9</span>
            <span>10</span>
            <span>11</span>
            <span>12</span>
            <span>13</span>
            <span>14</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            <span>15</span>
            <span>16</span>
            <span>17</span>
            <span>18</span>
            <span>19</span>
            <span>20</span>
            <span>21</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            <span>22</span>
            <span>23</span>
            <span>24</span>
            <span>25</span>
            <span>26</span>
            <span>27</span>
            <span>28</span>
          </div>
        </div>
      </div>
    </div>
  );
};
