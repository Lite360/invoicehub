import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SubscriptionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Subscription & Billing</h1>
        <p className="text-slate-500 mt-2">Manage your current plan and billing details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You are currently on the Free Trial plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">Trial Plan</div>
              <div className="text-sm text-slate-500 mt-1">Expires in 14 days</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-slate-900">₦0 / month</div>
              <div className="text-sm text-slate-500 mt-1">Free during trial</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4 border-t pt-6">
          <Button variant="outline">View Billing History</Button>
          <Button>Upgrade Plan</Button>
        </CardFooter>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>Your resource limits for this billing cycle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">Invoices</span>
                <span className="text-slate-500">3 / 10 used</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[30%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">Customers</span>
                <span className="text-slate-500">12 / 50 used</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[24%]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Securely managed via Paystack.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-slate-500 p-4 border border-dashed rounded-lg bg-slate-50 justify-center">
              No payment method on file yet.
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button variant="outline" className="w-full">Add Payment Method</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
