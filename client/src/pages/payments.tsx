import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockPayments, mockHouseholds } from "@/lib/mockData";
import { Download, Filter, Search, Wallet, CheckCircle2, XCircle, Clock } from "lucide-react";

export function Payments() {
  const totalDisbursed = mockPayments.reduce((acc, p) => p.status === 'Paid' ? acc + p.amount : acc, 0);
  const pendingCount = mockPayments.filter(p => p.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Payments & Disbursements</h1>
            <p className="text-muted-foreground">Track benefit transfers and payment reconciliation.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export Payment Cycle
          </Button>
        </div>

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Disbursed (YTD)</p>
                <p className="text-2xl font-bold">${totalDisbursed.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
             <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Transfers</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
             <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Payments</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search Household ID..." className="pl-8 bg-background" />
              </div>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Payment Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jan25">Jan 2025</SelectItem>
                  <SelectItem value="dec24">Dec 2024</SelectItem>
                  <SelectItem value="nov24">Nov 2024</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" className="w-full gap-2">
                <Filter className="h-4 w-4" /> Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent benefit transfers to registered households.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Household</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayments.map((payment) => {
                  const household = mockHouseholds.find(h => h.id === payment.householdId);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{household?.headOfHousehold.firstName} {household?.headOfHousehold.lastName}</span>
                          <span className="text-xs text-muted-foreground">{payment.householdId}</span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.cycle}</TableCell>
                      <TableCell className="font-bold">${payment.amount}</TableCell>
                      <TableCell>{payment.provider}</TableCell>
                      <TableCell>{payment.disbursementDate || '-'}</TableCell>
                      <TableCell className="text-right">
                         <Badge className={
                          payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200' :
                          payment.status === 'Pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200' : 
                          'bg-destructive/10 text-destructive border-destructive/20'
                        } variant="outline">
                          {payment.status === 'Paid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {payment.status === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
