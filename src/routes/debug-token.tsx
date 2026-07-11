import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Copy, Trash2 } from "lucide-react";
import { message } from "antd";

export const Route = createFileRoute("/debug-token")({
  component: DebugTokenPage,
});

function DebugTokenPage() {
  const { session, user } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const API_BASE = "http://localhost:5000";

  const getTokenInfo = () => {
    const token = localStorage.getItem('wis_auth_token');
    const userData = localStorage.getItem('wis_user_data');
    
    return {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 40)}...` : 'null',
      tokenLength: token?.length || 0,
      hasUser: !!userData,
      userData: userData ? JSON.parse(userData) : null,
    };
  };

  const testToken = async () => {
    setTesting(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Profile API
      const profileTest = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${session?.token}`
        }
      });
      const profileData = await profileTest.json();
      results.tests.push({
        name: 'Profile API',
        status: profileTest.status,
        success: profileTest.ok,
        data: profileData
      });

      // Test 2: Users API
      const usersTest = await fetch(`${API_BASE}/api/users`, {
        headers: {
          'Authorization': `Bearer ${session?.token}`
        }
      });
      const usersData = await usersTest.json();
      results.tests.push({
        name: 'Users API',
        status: usersTest.status,
        success: usersTest.ok,
        data: usersData
      });

      // Test 3: Chat Conversations API
      const chatTest = await fetch(`${API_BASE}/api/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${session?.token}`
        }
      });
      const chatData = await chatTest.json();
      results.tests.push({
        name: 'Chat API',
        status: chatTest.status,
        success: chatTest.ok,
        data: chatData
      });

      setTestResults(results);
      
      const failedTests = results.tests.filter((t: any) => !t.success);
      if (failedTests.length === 0) {
        message.success('All API tests passed! ✅');
      } else {
        message.error(`${failedTests.length} test(s) failed`);
      }
    } catch (error) {
      console.error('Test error:', error);
      message.error('Test failed: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    message.success('LocalStorage cleared! Please refresh and log in again.');
    setTimeout(() => window.location.reload(), 1500);
  };

  const copyToken = () => {
    const token = localStorage.getItem('wis_auth_token');
    if (token) {
      navigator.clipboard.writeText(token);
      message.success('Token copied to clipboard!');
    } else {
      message.error('No token to copy');
    }
  };

  const tokenInfo = getTokenInfo();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🔍 Token Debug Panel</CardTitle>
          <CardDescription>Diagnose authentication and token issues</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Context has session:</span>
              {session ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" /> Yes
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> No
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Context has user:</span>
              {user ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" /> Yes
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> No
                </Badge>
              )}
            </div>

            {user && (
              <div className="mt-4 p-3 bg-muted rounded-md text-xs">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Company:</strong> {user.company}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LocalStorage Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">LocalStorage Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Has token:</span>
              {tokenInfo.hasToken ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" /> Yes ({tokenInfo.tokenLength} chars)
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> No
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Has user data:</span>
              {tokenInfo.hasUser ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" /> Yes
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> No
                </Badge>
              )}
            </div>

            {tokenInfo.hasToken && (
              <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono break-all">
                {tokenInfo.tokenPreview}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={copyToken} className="gap-2">
                <Copy className="h-3 w-3" />
                Copy Token
              </Button>
              <Button size="sm" variant="destructive" onClick={clearLocalStorage} className="gap-2">
                <Trash2 className="h-3 w-3" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Tests</CardTitle>
          <CardDescription>Test if your token works with different APIs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testToken} disabled={testing || !session?.token}>
            {testing ? 'Testing...' : 'Run API Tests'}
          </Button>

          {testResults && (
            <div className="space-y-3 mt-4">
              {testResults.tests.map((test: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{test.name}</h4>
                    {test.success ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" /> {test.status}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> {test.status}
                      </Badge>
                    )}
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Troubleshooting Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>If token exists but APIs fail with 401: Token might be expired or JWT_SECRET changed. Clear localStorage and log in again.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>If no token in localStorage: Login process failed. Check backend server is running on port 5000.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>Check browser console (F12) for detailed debug logs from Auth and Chat modules.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>Check backend terminal for authentication middleware logs.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
