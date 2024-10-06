import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { HelpCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const EnhancedDesmosReplica = () => {
  const [formula, setFormula] = useState('x^2');
  const [analysis, setAnalysis] = useState({
    xIntercepts: [],
    yIntercept: null,
    domain: "",
    range: "",
    transformations: ""
  });
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [xDomain, setXDomain] = useState([-10, 10]);
  const [yDomain, setYDomain] = useState([-10, 10]);
  const [zoomDomain, setZoomDomain] = useState({ x: [-10, 10], y: [-10, 10] });
  const chartRef = useRef(null);

  const generateData = useCallback((formula, xMin, xMax, steps = 500) => {
    const data = [];
    const step = (xMax - xMin) / steps;
    for (let x = xMin; x <= xMax; x += step) {
      try {
        let safeFormula = formula
          .replace(/\^/g, '**')
          .replace(/sin/g, 'Math.sin')
          .replace(/cos/g, 'Math.cos')
          .replace(/tan/g, 'Math.tan')
          .replace(/log/g, 'Math.log')
          .replace(/sqrt/g, 'Math.sqrt')
          .replace(/abs/g, 'Math.abs')
          .replace(/pi/g, 'Math.PI')
          .replace(/e(?![a-zA-Z])/g, 'Math.E');
        
        if (safeFormula.startsWith('y=')) {
          safeFormula = safeFormula.slice(2);
        }
        
        const f = new Function('x', 'return ' + safeFormula);
        const y = f(x);
        
        if (!isNaN(y) && isFinite(y)) {
          data.push({ x, y });
        }
      } catch (error) {
        console.error('Error evaluating formula:', error);
      }
    }
    return data;
  }, []);

  const analyzeFunction = useCallback((data, formula) => {
    let xIntercepts = [];
    let yIntercept = null;
    let domain = "All real numbers";
    let range = "Calculating...";
    let transformations = "";

    for (let i = 1; i < data.length; i++) {
      if (data[i-1].y * data[i].y <= 0) {
        xIntercepts.push(data[i].x.toFixed(2));
      }
      if (Math.abs(data[i].x) < 0.01) {
        yIntercept = data[i].y.toFixed(2);
      }
    }

    if (formula.includes('sqrt') || formula.includes('log')) {
      domain = "x ≥ 0";
    }

    const yValues = data.map(point => point.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    range = `[${minY.toFixed(2)}, ${maxY.toFixed(2)}]`;

    if (formula.includes('sin') || formula.includes('cos') || formula.includes('tan')) {
      transformations += "Trigonometric function\n";
    }
    if (formula.includes('log')) {
      transformations += "Logarithmic function\n";
    }
    if (formula.includes('e**')) {
      transformations += "Exponential function\n";
    }
    if (formula.startsWith('-')) {
      transformations += "Reflection over x-axis\n";
    }
    if (formula.includes('(x +') || formula.includes('(x -')) {
      transformations += "Horizontal shift\n";
    }
    if (formula.includes('+ ') || formula.includes('- ')) {
      transformations += "Vertical shift\n";
    }

    return {
      xIntercepts,
      yIntercept: yIntercept || null,
      domain,
      range,
      transformations: transformations || "No major transformations detected"
    };
  }, []);

  const handleFormulaChange = (e) => {
    setFormula(e.target.value);
  };

  const handleSubmit = useCallback(() => {
    try {
      const newData = generateData(formula, xDomain[0], xDomain[1]);
      setData(newData);
      setAnalysis(analyzeFunction(newData, formula));
      setZoomDomain({ x: xDomain, y: yDomain });
      setError('');
    } catch (error) {
      setError('Invalid formula. Please check your input.');
    }
  }, [formula, xDomain, yDomain, generateData, analyzeFunction]);

  const handleXDomainChange = (newValue) => {
    setXDomain(newValue);
    setZoomDomain(prevState => ({ ...prevState, x: newValue }));
  };

  const handleYDomainChange = (newValue) => {
    setYDomain(newValue);
    setZoomDomain(prevState => ({ ...prevState, y: newValue }));
  };

  const insertSymbol = (symbol) => {
    setFormula(prevFormula => prevFormula + symbol);
  };

  const handleWheel = useCallback((event) => {
    if (chartRef.current && chartRef.current.contains(event.target)) {
      event.preventDefault();
      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
      setZoomDomain(prevDomain => ({
        x: [
          prevDomain.x[0] * zoomFactor,
          prevDomain.x[1] * zoomFactor
        ],
        y: [
          prevDomain.y[0] * zoomFactor,
          prevDomain.y[1] * zoomFactor
        ]
      }));
    }
  }, []);

  useEffect(() => {
    handleSubmit();
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleSubmit, handleWheel]);

  return (
    <div className="h-screen flex flex-col p-4">
      <div className="mb-4">
        <div className="flex mb-2">
          <Input
            type="text"
            value={formula}
            onChange={handleFormulaChange}
            placeholder="Enter formula (e.g., x^2, sin(x), y=x^2+3)"
            className="mr-2"
          />
          <Button onClick={handleSubmit}>Graph</Button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <Button onClick={() => insertSymbol('^')}>x^n</Button>
          <Button onClick={() => insertSymbol('sqrt()')}>√</Button>
          <Button onClick={() => insertSymbol('sin()')}>sin</Button>
          <Button onClick={() => insertSymbol('cos()')}>cos</Button>
          <Button onClick={() => insertSymbol('tan()')}>tan</Button>
          <Button onClick={() => insertSymbol('log()')}>log</Button>
          <Button onClick={() => insertSymbol('abs()')}>|x|</Button>
          <Button onClick={() => insertSymbol('pi')}>π</Button>
          <Button onClick={() => insertSymbol('e')}>e</Button>
          <Button onClick={() => insertSymbol('arcsin()')}>arcsin</Button>
          <Button onClick={() => insertSymbol('arccos()')}>arccos</Button>
          <Button onClick={() => insertSymbol('arctan()')}>arctan</Button>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center mb-2">
          <span className="mr-2">X Range:</span>
          <Slider
            min={-100}
            max={100}
            step={1}
            value={xDomain}
            onValueChange={handleXDomainChange}
            className="w-64 mr-4"
          />
          <span>{xDomain[0].toFixed(2)} to {xDomain[1].toFixed(2)}</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2">Y Range:</span>
          <Slider
            min={-100}
            max={100}
            step={1}
            value={yDomain}
            onValueChange={handleYDomainChange}
            className="w-64 mr-4"
          />
          <span>{yDomain[0].toFixed(2)} to {yDomain[1].toFixed(2)}</span>
        </div>
      </div>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Function Analysis:</h2>
        <p><strong>X-intercepts:</strong> {analysis.xIntercepts.length > 0 ? analysis.xIntercepts.join(", ") : "None found in visible range"}</p>
        <p><strong>Y-intercept:</strong> {analysis.yIntercept !== null ? analysis.yIntercept : "None found in visible range"}</p>
        <p><strong>Domain:</strong> {analysis.domain}</p>
        <p><strong>Range:</strong> {analysis.range}</p>
        <p><strong>Transformations:</strong> {analysis.transformations}</p>
      </div>
      <div className="flex-grow" style={{ minHeight: '60vh' }} ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              type="number" 
              domain={zoomDomain.x} 
              tickFormatter={(value) => value.toFixed(1)}
              allowDataOverflow
            />
            <YAxis 
              type="number" 
              domain={zoomDomain.y}
              tickFormatter={(value) => value.toFixed(1)}
              allowDataOverflow
            />
            <Tooltip 
              formatter={(value, name) => [value.toFixed(2), name]}
              labelFormatter={(label) => `x: ${parseFloat(label).toFixed(2)}`}
            />
            <ReferenceLine x={0} stroke="#666" strokeWidth={2} />
            <ReferenceLine y={0} stroke="#666" strokeWidth={2} />
            {analysis.xIntercepts.map((x, index) => (
              <ReferenceLine key={`x-${index}`} x={parseFloat(x)} stroke="#f00" strokeWidth={2} />
            ))}
            {analysis.yIntercept !== null && (
              <ReferenceLine y={parseFloat(analysis.yIntercept)} stroke="#f00" strokeWidth={2} />
            )}
            <Line type="monotone" dataKey="y" stroke="#8884d8" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="icon" className="fixed bottom-4 right-4">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>How to Use the Graph Calculator</AlertDialogTitle>
            <AlertDialogDescription>
              <h3 className="font-bold mt-2">What Works:</h3>
              <ul className="list-disc pl-5">
                <li>Basic arithmetic: x+2, 3*x-1</li>
                <li>Powers: x^2, x^3</li>
                <li>Trigonometric functions: sin(x), cos(x), tan(x)</li>
                <li>Inverse trigonometric functions: arcsin(x), arccos(x), arctan(x)</li>
                <li>Logarithms and exponentials: log(x), e^x</li>
                <li>Square roots: sqrt(x)</li>
                <li>Absolute value: abs(x)</li>
                <li>Constants: pi, e</li>
              </ul>
              <h3 className="font-bold mt-2">What Doesn't Work:</h3>
              <ul className="list-disc pl-5">
                <li>Multiple variable equations</li>
                <li>Implicit functions</li>
                <li>Piecewise functions</li>
                <li>Calculus operations (derivatives, integrals)</li>
              </ul>
              <h3 className="font-bold mt-2">Input Examples:</h3>
              <ul className="list-disc pl-5">
                <li>y = x^2 + 3</li>
                <li>sin(x) + cos(x)</li>
                <li>sqrt(abs(x))</li>
                <li>log(x+1) / x</li>
                <li>e^x + arctan(x)</li>
              </ul>
              <p className="mt-2">Use the function buttons for quick insertion of common operations.</p>
              <p className="mt-2">You can zoom in/out using the mouse wheel. The x and y range sliders allow you to reset the view.</p>
              <p className="mt-2">The x and y axes are marked in bold, and intercepts are highlighted in red.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedDesmosReplica;
