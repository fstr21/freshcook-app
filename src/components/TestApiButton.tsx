import React, { useState } from 'react'
import { TestTube, CheckCircle, XCircle, Loader, Key } from 'lucide-react'
import { supabase } from '../lib/supabase'

export const TestApiButton: React.FC = () => {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [testType, setTestType] = useState<'vision' | 'openrouter'>('vision')

  const testGoogleVisionApi = async () => {
    setTesting(true)
    setResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('test-vision-api')
      
      if (error) {
        setResult({
          success: false,
          error: error.message,
          type: 'edge_function_error'
        })
      } else {
        setResult(data)
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'network_error'
      })
    } finally {
      setTesting(false)
    }
  }

  const testOpenRouterApi = async () => {
    setTesting(true)
    setResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('test-openrouter-key')
      
      if (error) {
        setResult({
          success: false,
          error: error.message,
          type: 'edge_function_error'
        })
      } else {
        setResult(data)
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'network_error'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleTest = () => {
    if (testType === 'vision') {
      testGoogleVisionApi()
    } else {
      testOpenRouterApi()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <TestTube className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">API Connection Test</h3>
      </div>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTestType('vision')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            testType === 'vision'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Google Vision
        </button>
        <button
          onClick={() => setTestType('openrouter')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            testType === 'openrouter'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          OpenRouter
        </button>
      </div>
      
      <button
        onClick={handleTest}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {testing ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Testing {testType === 'vision' ? 'Vision' : 'OpenRouter'} API...
          </>
        ) : (
          <>
            {testType === 'vision' ? <TestTube className="w-4 h-4" /> : <Key className="w-4 h-4" />}
            Test {testType === 'vision' ? 'Google Vision' : 'OpenRouter'} API
          </>
        )}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? 'API Test Passed' : 'API Test Failed'}
            </span>
          </div>
          
          {result.message && (
            <p className={`text-sm mb-2 ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
          )}
          
          {result.error && (
            <p className="text-sm text-red-700 mb-2">
              <strong>Error:</strong> {result.error}
            </p>
          )}

          {/* OpenRouter specific results */}
          {testType === 'openrouter' && result.availableKeys && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Available Keys:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {result.availableKeys.map((key: string) => (
                  <li key={key}>• {key}</li>
                ))}
              </ul>
            </div>
          )}

          {testType === 'openrouter' && result.keyTests && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Key Analysis:</p>
              {Object.entries(result.keyTests).map(([keyName, keyData]: [string, any]) => (
                <div key={keyName} className="mb-3 p-2 bg-gray-50 rounded text-xs">
                  <p className="font-medium">{keyName}:</p>
                  {keyData.exists ? (
                    <div className="mt-1 space-y-1">
                      <p>Length: {keyData.length}</p>
                      <p>First chars: {keyData.firstChars}</p>
                      <p>Starts with sk-or-: {keyData.startsWithSkOr ? '✅' : '❌'}</p>
                      <p>Has whitespace: {keyData.hasWhitespace ? '⚠️' : '✅'}</p>
                      <p>Has quotes: {keyData.hasQuotes ? '⚠️' : '✅'}</p>
                      {keyData.isDifferentAfterTrim && (
                        <p className="text-orange-600">⚠️ Key has leading/trailing whitespace</p>
                      )}
                      {keyData.cleaned?.isDifferent && (
                        <p className="text-blue-600">🔧 Cleaned version available</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-600">Not found</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.apiTest && (
            <div className="mt-3 p-2 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-700 mb-1">API Test Result:</p>
              <p className="text-xs">Status: {result.apiTest.status} {result.apiTest.statusText}</p>
              {result.apiTest.error && (
                <p className="text-xs text-red-600 mt-1">Error: {result.apiTest.error}</p>
              )}
            </div>
          )}
          
          <details className="mt-2">
            <summary className={`text-sm cursor-pointer ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              View Raw Details
            </summary>
            <pre className={`mt-2 p-2 rounded text-xs overflow-auto max-h-64 ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}