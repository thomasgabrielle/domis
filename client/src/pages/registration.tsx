import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { Plus, Trash2, MapPin, User, FileText } from "lucide-react";

export function Registration() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [members, setMembers] = useState([{ id: 1 }]); // Start with one member (Head)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Registration Successful",
      description: "Household has been registered and queued for assessment.",
    });
    setTimeout(() => setLocation("/"), 1500);
  };

  const addMember = () => {
    setMembers([...members, { id: members.length + 1 }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = [...members];
      newMembers.splice(index, 1);
      setMembers(newMembers);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Household Registration</h1>
          <p className="text-muted-foreground">Create a new household profile for the Public Assistance Program.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            
            {/* Location Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Location & Address</CardTitle>
                </div>
                <CardDescription>Geographic location of the household dwelling.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="province">Province/Region</Label>
                  <Select>
                    <SelectTrigger id="province">
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central">Central Province</SelectItem>
                      <SelectItem value="eastern">Eastern Province</SelectItem>
                      <SelectItem value="western">Western Province</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Select>
                    <SelectTrigger id="district">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="capital">Capital District</SelectItem>
                      <SelectItem value="river">River District</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village / Community</Label>
                  <Input id="village" placeholder="Enter village name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gps">GPS Coordinates (Optional)</Label>
                  <div className="flex gap-2">
                    <Input id="gps" placeholder="Lat, Long" />
                    <Button type="button" variant="outline" size="icon" title="Get Current Location">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Household Members */}
            <Card>
              <CardHeader>
                 <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle>Household Roster</CardTitle>
                  </div>
                  <Button type="button" onClick={addMember} variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Member
                  </Button>
                </div>
                <CardDescription>Enter details for Head of Household and all dependents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {members.map((member, index) => (
                  <div key={member.id} className="relative animate-in fade-in slide-in-from-bottom-2">
                    {index > 0 && <Separator className="my-6" />}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                        {index === 0 ? "Head of Household" : `Member #${index + 1}`}
                      </h3>
                      {index > 0 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeMember(index)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input placeholder="Given Name" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input placeholder="Surname" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Relationship to Head</Label>
                        <Select defaultValue={index === 0 ? "head" : undefined} disabled={index === 0}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="head">Self (Head)</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="other">Other Relative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>National ID / Ref #</Label>
                        <Input placeholder="ID Number" />
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox id={`disability-${index}`} />
                      <Label htmlFor={`disability-${index}`} className="font-normal text-muted-foreground">
                        This member has a documented disability
                      </Label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Vulnerability Assessment Preliminary */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Preliminary Assessment</CardTitle>
                </div>
                <CardDescription>Basic dwelling and economic indicators.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Housing Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary material of dwelling" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent (Concrete/Brick)</SelectItem>
                      <SelectItem value="semi">Semi-Permanent (Mud/Wood)</SelectItem>
                      <SelectItem value="temporary">Temporary (Makeshift)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Source of Income</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary income source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agriculture">Subsistence Agriculture</SelectItem>
                      <SelectItem value="labor">Casual Labor</SelectItem>
                      <SelectItem value="trading">Small Trading</SelectItem>
                      <SelectItem value="none">No Income Source</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Interviewer Notes</Label>
                  <Textarea placeholder="Any additional observations about the household's living conditions..." />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 flex justify-end gap-4 p-6">
                <Button type="button" variant="outline" onClick={() => setLocation("/")}>Cancel</Button>
                <Button type="submit" size="lg" className="min-w-[150px]">Register Household</Button>
              </CardFooter>
            </Card>

          </div>
        </form>
      </main>
    </div>
  );
}
