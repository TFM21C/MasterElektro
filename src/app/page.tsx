
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Settings, BookOpen, LogIn, PlusCircle, Rocket } from 'lucide-react';
import { DEMO_PROJECTS } from '@/config/demo-projects';
import NewProjectDialog from '@/components/modals/NewProjectDialog';

export default function HomePage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = (name: string, type: string) => {
    const url = `/new-project?projectName=${encodeURIComponent(name)}&projectType=${encodeURIComponent(type)}`;
    router.push(url);
  };

  const handleLoadDemo = () => {
    const demo = DEMO_PROJECTS[0];
    if (!demo) return;
    const url = `/new-project?projectName=${encodeURIComponent(demo.projectName)}&projectType=${encodeURIComponent(demo.projectType)}&components=${encodeURIComponent(JSON.stringify(demo.components))}&connections=${encodeURIComponent(JSON.stringify(demo.connections))}`;
    router.push(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <header className="absolute top-0 right-0 p-6">
        <Button variant="outline">
          <LogIn className="mr-2 h-4 w-4" /> Login
        </Button>
      </header>

      <main className="flex flex-col items-center text-center">
        <img src="https://placehold.co/150x150.png" alt="CircuitCraft Logo" data-ai-hint="logo circuit" className="mb-8 rounded-full" />
        <h1 className="text-5xl font-bold text-primary mb-4">
          CircuitCraft
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
          Willkommen bei CircuitCraft! Entwerfen, simulieren und lernen Sie elektrische Schaltungen auf intuitive Weise. Perfekt für Azubis und Profis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
          <Card onClick={() => setIsDialogOpen(true)} className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <PlusCircle className="mr-3 h-8 w-8 text-primary" />
                Neues Projekt
              </CardTitle>
              <CardDescription>Starten Sie ein neues Schaltungsdesign von Grund auf.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
               <Button className="w-full mt-auto" onClick={() => setIsDialogOpen(true)}>Projekt erstellen</Button>
            </CardContent>
          </Card>

          <Card onClick={handleLoadDemo} className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Rocket className="mr-3 h-8 w-8 text-primary" />
                Demo-Projekt laden
              </CardTitle>
              <CardDescription>Lädt eine vorgefertigte Beispielschaltung.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
               <Button className="w-full mt-auto" onClick={handleLoadDemo}>Demo laden</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-not-allowed opacity-50 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <ListChecks className="mr-3 h-8 w-8 text-muted-foreground" />
                Projekt laden
              </CardTitle>
              <CardDescription>Öffnen Sie ein zuvor gespeichertes Projekt (bald verfügbar).</CardDescription>
            </CardHeader>
             <CardContent className="flex-grow flex items-end">
                <Button className="w-full mt-auto" disabled>Laden</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-not-allowed opacity-50 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <BookOpen className="mr-3 h-8 w-8 text-muted-foreground" />
                Lerninhalte
              </CardTitle>
              <CardDescription>Greifen Sie auf Übungen und Lernmaterialien zu (bald verfügbar).</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
                <Button className="w-full mt-auto" disabled>Lernen</Button>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 flex justify-center w-full max-w-4xl">
           <Card className="hover:shadow-lg transition-shadow cursor-not-allowed opacity-50 w-full md:w-1/3 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Settings className="mr-3 h-8 w-8 text-muted-foreground" />
                Einstellungen
              </CardTitle>
              <CardDescription>Passen Sie die Anwendungseinstellungen an (bald verfügbar).</CardDescription>
            </CardHeader>
             <CardContent className="flex-grow flex items-end">
                <Button className="w-full mt-auto" disabled>Öffnen</Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <NewProjectDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreate={handleCreate}
      />

      <footer className="absolute bottom-0 p-6 text-center w-full">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CircuitCraft. Eine Lernanwendung für Elektrotechnik-Azubis.
        </p>
      </footer>
    </div>
  );
}
