import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { type Project } from "@/mocks/projects";

export interface UserProject extends Project {
  isUserCreated: boolean;
  published: boolean;
  earnings: number;
  pendingEarnings: number;
  donorsCount: number;
  createdAt: string;
}

export interface FundTransaction {
  id: string;
  type: "incoming" | "withdrawal";
  amount: number;
  currency: string;
  from: string;
  to: string;
  timestamp: string;
  status: "confirmed" | "pending" | "processing";
  projectId?: string;
  projectName?: string;
}

const PROJECTS_KEY = "impactchain_user_projects";
const FUNDS_KEY = "impactchain_fund_transactions";

export const [ProjectsProvider, useProjects] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [fundTransactions, setFundTransactions] = useState<FundTransaction[]>([]);

  const projectsQuery = useQuery({
    queryKey: ["user-projects"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PROJECTS_KEY);
      return stored ? (JSON.parse(stored) as UserProject[]) : [];
    },
    staleTime: Infinity,
  });

  const fundsQuery = useQuery({
    queryKey: ["fund-transactions"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FUNDS_KEY);
      return stored ? (JSON.parse(stored) as FundTransaction[]) : [];
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (projectsQuery.data) setUserProjects(projectsQuery.data);
  }, [projectsQuery.data]);

  useEffect(() => {
    if (fundsQuery.data) setFundTransactions(fundsQuery.data);
  }, [fundsQuery.data]);

  const saveProjects = useCallback(async (projects: UserProject[]) => {
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    queryClient.setQueryData(["user-projects"], projects);
  }, [queryClient]);

  const saveFunds = useCallback(async (txns: FundTransaction[]) => {
    await AsyncStorage.setItem(FUNDS_KEY, JSON.stringify(txns));
    queryClient.setQueryData(["fund-transactions"], txns);
  }, [queryClient]);

  const createProjectMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      category: Project["category"];
      location: string;
      country: string;
      goal: number;
      currency: string;
      imageUrl: string;
      sdgGoals: number[];
    }) => {
      await new Promise((r) => setTimeout(r, 1200));
      const id = `proj-user-${Date.now()}`;
      const newProject: UserProject = {
        id,
        name: input.name,
        description: input.description,
        category: input.category,
        location: input.location,
        country: input.country,
        raised: 0,
        goal: input.goal,
        currency: input.currency,
        beneficiaries: 0,
        milestones: 4,
        milestonesCompleted: 0,
        status: "upcoming",
        imageUrl: input.imageUrl || "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800",
        sdgGoals: input.sdgGoals,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        team: "Your Team",
        verifications: 0,
        isUserCreated: true,
        published: false,
        earnings: 0,
        pendingEarnings: 0,
        donorsCount: 0,
        createdAt: new Date().toISOString(),
      };
      const updated = [newProject, ...userProjects];
      setUserProjects(updated);
      await saveProjects(updated);
      console.log("[Projects] Created project:", id, input.name);
      return newProject;
    },
  });

  const publishProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await new Promise((r) => setTimeout(r, 1500));
      const updated = userProjects.map((p) =>
        p.id === projectId ? { ...p, published: true, status: "active" as const } : p
      );
      setUserProjects(updated);
      await saveProjects(updated);
      console.log("[Projects] Published project:", projectId);
      return projectId;
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (params: { projectId: string; amount: number; toAddress: string }) => {
      await new Promise((r) => setTimeout(r, 2000));
      const project = userProjects.find((p) => p.id === params.projectId);
      if (!project) throw new Error("Project not found");
      if (params.amount > project.earnings) throw new Error("Insufficient funds");

      const updatedProjects = userProjects.map((p) =>
        p.id === params.projectId
          ? { ...p, earnings: p.earnings - params.amount }
          : p
      );
      setUserProjects(updatedProjects);
      await saveProjects(updatedProjects);

      const tx: FundTransaction = {
        id: `ftx-${Date.now()}`,
        type: "withdrawal",
        amount: params.amount,
        currency: project.currency,
        from: params.projectId,
        to: params.toAddress,
        timestamp: new Date().toISOString(),
        status: "confirmed",
        projectId: params.projectId,
        projectName: project.name,
      };
      const updatedFunds = [tx, ...fundTransactions];
      setFundTransactions(updatedFunds);
      await saveFunds(updatedFunds);
      console.log("[Projects] Withdrawal:", params.amount, "from", params.projectId);
      return tx;
    },
  });

  const simulateDonation = useCallback(async (projectId: string, amount: number, fromAddr: string) => {
    const project = userProjects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedProjects = userProjects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            raised: p.raised + amount,
            earnings: p.earnings + amount,
            donorsCount: p.donorsCount + 1,
          }
        : p
    );
    setUserProjects(updatedProjects);
    await saveProjects(updatedProjects);

    const tx: FundTransaction = {
      id: `ftx-${Date.now()}`,
      type: "incoming",
      amount,
      currency: project.currency,
      from: fromAddr,
      to: projectId,
      timestamp: new Date().toISOString(),
      status: "confirmed",
      projectId,
      projectName: project.name,
    };
    const updatedFunds = [tx, ...fundTransactions];
    setFundTransactions(updatedFunds);
    await saveFunds(updatedFunds);
  }, [userProjects, fundTransactions, saveProjects, saveFunds]);

  const totalEarnings = useMemo(() => userProjects.reduce((s, p) => s + p.earnings, 0), [userProjects]);
  const totalRaised = useMemo(() => userProjects.reduce((s, p) => s + p.raised, 0), [userProjects]);

  return useMemo(() => ({
    userProjects,
    fundTransactions,
    totalEarnings,
    totalRaised,
    isLoading: projectsQuery.isLoading || fundsQuery.isLoading,
    createProject: createProjectMutation,
    publishProject: publishProjectMutation,
    withdraw: withdrawMutation,
    simulateDonation,
  }), [userProjects, fundTransactions, totalEarnings, totalRaised, projectsQuery.isLoading, fundsQuery.isLoading, createProjectMutation, publishProjectMutation, withdrawMutation, simulateDonation]);
});
