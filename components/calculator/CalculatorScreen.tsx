'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useThreatDetection } from '../../hooks/useThreatDetection';
import { useDeviceMotion } from '../../hooks/useDeviceMotion';

export default function CalculatorScreen() {
  const router = useRouter();
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [zeroTapCount, setZeroTapCount] = useState(0);
  const { startMonitoring, isMonitoring } = useThreatDetection();
  
  // Need to call requestPermission on user interaction for iOS
  const { requestPermission } = useDeviceMotion();

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const zeroTapTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start silent monitoring in background
    startMonitoring();
  }, [startMonitoring]);

  const handleUnlock = () => {
    router.push('/dashboard');
  };

  const handleZeroTap = () => {
    setZeroTapCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        handleUnlock();
        return 0;
      }
      return newCount;
    });

    if (zeroTapTimer.current) clearTimeout(zeroTapTimer.current);
    zeroTapTimer.current = setTimeout(() => {
      setZeroTapCount(0);
    }, 1000);
  };

  const handleEqualStart = async () => {
    // Request permission on user interaction if needed
    await requestPermission();
    
    longPressTimer.current = setTimeout(() => {
      handleUnlock();
    }, 1500);
  };

  const handleEqualEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const inputDigit = (digit: string) => {
    if (digit === '0') handleZeroTap();
    
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevVal(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const inputPercent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevVal == null) {
      setPrevVal(inputValue);
    } else if (operator) {
      const currentValue = prevVal || 0;
      let newValue = currentValue;

      if (operator === '+') newValue = currentValue + inputValue;
      else if (operator === '−') newValue = currentValue - inputValue;
      else if (operator === '×') newValue = currentValue * inputValue;
      else if (operator === '÷') newValue = currentValue / inputValue;

      setPrevVal(newValue);
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  // Adjust font size based on length
  const fontSizeClass = display.length > 8 ? 'text-4xl' : 'text-7xl';

  return (
    <div className="flex h-screen flex-col bg-[#1c1c1e] text-white p-4 justify-end relative">
      {/* Tiny monitoring indicator */}
      {isMonitoring && (
        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-safe/50"></div>
      )}
      
      <div className={`text-right w-full mb-4 px-4 font-light tracking-tight truncate ${fontSizeClass}`}>
        {display}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <button className="btn-func" onClick={clearAll}>{display === '0' ? 'AC' : 'C'}</button>
        <button className="btn-func" onClick={toggleSign}>±</button>
        <button className="btn-func" onClick={inputPercent}>%</button>
        <button className={`btn-op ${operator === '÷' ? 'bg-white text-[#ff9f0a]' : ''}`} onClick={() => performOperation('÷')}>÷</button>

        <button className="btn-num" onClick={() => inputDigit('7')}>7</button>
        <button className="btn-num" onClick={() => inputDigit('8')}>8</button>
        <button className="btn-num" onClick={() => inputDigit('9')}>9</button>
        <button className={`btn-op ${operator === '×' ? 'bg-white text-[#ff9f0a]' : ''}`} onClick={() => performOperation('×')}>×</button>

        <button className="btn-num" onClick={() => inputDigit('4')}>4</button>
        <button className="btn-num" onClick={() => inputDigit('5')}>5</button>
        <button className="btn-num" onClick={() => inputDigit('6')}>6</button>
        <button className={`btn-op ${operator === '−' ? 'bg-white text-[#ff9f0a]' : ''}`} onClick={() => performOperation('−')}>−</button>

        <button className="btn-num" onClick={() => inputDigit('1')}>1</button>
        <button className="btn-num" onClick={() => inputDigit('2')}>2</button>
        <button className="btn-num" onClick={() => inputDigit('3')}>3</button>
        <button className={`btn-op ${operator === '+' ? 'bg-white text-[#ff9f0a]' : ''}`} onClick={() => performOperation('+')}>+</button>

        <button className="btn-num col-span-2 pl-6 text-left rounded-full" onClick={() => inputDigit('0')}>0</button>
        <button className="btn-num" onClick={inputDot}>.</button>
        <button 
          className="btn-op" 
          onPointerDown={handleEqualStart}
          onPointerUp={handleEqualEnd}
          onPointerLeave={handleEqualEnd}
          onClick={() => performOperation('=')}
        >=</button>
      </div>
      
      <style jsx>{`
        .btn-num {
          background-color: #3a3a3c;
          border-radius: 9999px;
          height: 80px;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-num:active {
          background-color: #737373;
        }
        .btn-func {
          background-color: #d4d4d2;
          color: #1c1c1e;
          border-radius: 9999px;
          height: 80px;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-func:active {
          background-color: #ffffff;
        }
        .btn-op {
          background-color: #ff9f0a;
          color: white;
          border-radius: 9999px;
          height: 80px;
          font-size: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        .btn-op:active {
          background-color: #fbc78d;
        }
      `}</style>
    </div>
  );
}
