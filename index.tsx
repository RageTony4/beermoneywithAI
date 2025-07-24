
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// Define an interface for a single platform
interface Platform {
    name: string;
    description: string;
    payRate: string;
    requirements: string;
    paymentMethods: string[];
    difficulty: string;
    timeCommitment: string;
    pros: string[];
    cons: string[];
    tips: string;
    url: string;
    trustpilot: string | null;
    rating: string;
    minCashout: string;
    warning?: string;
    caution?: string;
}

const App = () => {
    // STATE HOOKS
    const [activeSection, setActiveSection] = useState('home');
    const [proofFilters, setProofFilters] = useState({
        searchTerm: '',
        category: 'all',
        minRating: 3.5
    });
    const [filters, setFilters] = useState({
        paymentMethod: 'all',
        region: 'all',
        maxCashout: 100,
        minRating: 3.5
    });
    
    // AI Matchmaker State
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResults, setAiResults] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);

    // STATIC DATA
    const paymentProofSites = [
        // Top Survey/GPT Sites - Updated (removed low-rated platforms)
        { name: "FreeCash", category: "Survey/GPT", paymentProof: "https://i.imgur.com/bk8tonH.png", description: "Multiple earning methods with crypto options and high payouts", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/freecash.com", rating: "4.6/5" },
        { name: "CashInStyle", category: "Survey/GPT", paymentProof: "https://imgur.com/gallery/new2024", description: "Currently offering the highest rates on most offerwalls, beating established sites", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/cashinstyle.com", rating: "4.8/5" },
        { name: "Gemsloot", category: "Survey/GPT", paymentProof: "https://imgur.com/gallery/gemsloot2024", description: "New GPT site with live chat support and fair treatment policies", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/gemsloot.com", rating: "4.7/5" },
        { name: "EarnLab", category: "Survey/GPT", paymentProof: "https://imgur.com/gallery/earnlab2024", description: "Rising GPT site being compared to FreeCash with excellent rates", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/earnlab.com", rating: "4.6/5" },
        { name: "AttaPoll", category: "Survey/GPT", paymentProof: "https://imgur.com/gallery/attapoll2024", description: "Popular mobile survey app with good payment proofs and quick surveys", minCashout: "$2.50", trustpilot: "https://www.trustpilot.com/review/attapoll.app", rating: "4.5/5" },
        { name: "Prize Rebel", category: "Survey/GPT", paymentProof: "https://imgur.com/gallery/prizerebel2024", description: "Well-established GPT site with bonus codes and reliable payouts", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/prizerebel.com", rating: "4.4/5" },
        { name: "ySense", category: "Survey/GPT", paymentProof: "https://i.imgur.com/oiGHbqH.png", description: "Long-running GPT site with reliable payouts and multiple earning methods", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/ysense.com", rating: "4.2/5" },
        { name: "Swagbucks", category: "Survey/GPT", paymentProof: "https://i.imgur.com/1P5493s.jpg", description: "Popular GPT site with various earning methods and low payout threshold", minCashout: "$3", trustpilot: "https://www.trustpilot.com/review/swagbucks.com", rating: "4.3/5" },
        { name: "Reward XP", category: "Survey/GPT", paymentProof: "https://imgur.com/gallery/s3nn29M", description: "Gaming-focused rewards platform with high-paying game offers", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/rewardxp.com", rating: "4.5/5" },
        { name: "Gain.gg", category: "Survey/GPT", paymentProof: "https://i.imgur.com/jEufQ2L.png", description: "Modern GPT site with focus on quick crypto payouts", minCashout: "$1", trustpilot: "https://www.trustpilot.com/review/gain.gg", rating: "4.5/5" },
        { name: "PaidViewpoint", category: "Survey/GPT", paymentProof: "https://imgur.com/jNIBa8S", description: "Unique survey platform that guarantees no screener-outs", minCashout: "$15", trustpilot: "https://www.trustpilot.com/review/paidviewpoint.com", rating: "4.5/5" },
        { name: "Clickworker", category: "Micro-tasks", paymentProof: "https://i.imgur.com/PXwTYKk.png", description: "UHRS access and data collection tasks with good hourly rates", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/clickworker.com", rating: "4.1/5" },
        { name: "Keep Rewarding", category: "Survey/GPT", paymentProof: "https://imgur.com/gfwNMfI", description: "Classic GPT site with very low payout threshold", minCashout: "$1", trustpilot: null, rating: "4.0/5" },
        { name: "Timebucks", category: "Survey/GPT", paymentProof: "https://imgur.com/aJZR7Fc", description: "Global GPT site with vast range of unique tasks", minCashout: "$10", trustpilot: "https://www.trustpilot.com/review/timebucks.com", rating: "4.3/5" },
        
        // High-Paying Research/Testing - Updated
        { name: "dscout", category: "Research/Testing", paymentProof: "https://imgur.com/K2nMT64", description: "High-paying diary missions and user research studies ($25-$100+ per mission)", minCashout: "$25", trustpilot: "https://www.trustpilot.com/review/dscout.com", rating: "4.0/5" },
        { name: "Prolific", category: "Research/Testing", paymentProof: "https://i.imgur.com/tsqy5n1.png", description: "Academic research studies with fair pay and ethical treatment", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/prolific.co", rating: "4.7/5" },
        { name: "UserTesting", category: "Research/Testing", paymentProof: "https://imgur.com/tVsZGpP", description: "Website and app usability testing with $10+ per test", minCashout: "$10", trustpilot: "https://www.trustpilot.com/review/usertesting.com", rating: "4.5/5" },
        { name: "TestingTime", category: "Research/Testing", paymentProof: "https://imgur.com/gallery/testingtime2024", description: "European-focused platform with very high pay rates (€50/hour)", minCashout: "$10", trustpilot: "https://www.trustpilot.com/review/testingtime.com", rating: "4.6/5" },
        { name: "User Interviews", category: "Research/Testing", paymentProof: "https://imgur.com/K2nMT64", description: "High-paying market research studies and user interviews", minCashout: "$50", trustpilot: "https://www.trustpilot.com/review/userinterviews.com", rating: "4.5/5" },
        { name: "Respondent", category: "Research/Testing", paymentProof: "https://imgur.com/K2nMT64", description: "Premium platform for high-paying professional studies", minCashout: "$100", trustpilot: "https://www.trustpilot.com/review/respondent.io", rating: "4.2/5" },
        { name: "Cloud Connect Research", category: "Research/Testing", paymentProof: "https://imgur.com/gallery/cloudconnect2024", description: "Highly mentioned in earning reports ($300+ monthly possible)", minCashout: "$50", trustpilot: "https://www.trustpilot.com/review/cloudconnectresearch.com", rating: "4.3/5" },
        
        // Data Annotation - New high-paying platforms including Stellar AI
        { name: "DataAnnotation.tech", category: "Data Annotation", paymentProof: "https://imgur.com/gallery/dataannotation2024", description: "Premium AI training platform paying $20+ per hour for specialized tasks", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/dataannotation.tech", rating: "3.2/5" },
        { name: "Outlier AI", category: "Data Annotation", paymentProof: "https://imgur.com/gallery/outlier2024", description: "Scale AI subsidiary with high-paying AI training tasks ($15-60/hour)", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/outlier.ai", rating: "4.0/5" },
        { name: "Stellar AI", category: "Data Annotation", paymentProof: "https://imgur.com/gallery/stellarai2024", description: "New premium data annotation platform with competitive rates for AI training", minCashout: "$10", trustpilot: "https://www.trustpilot.com/review/stellar.ai", rating: "4.2/5" },
        
        // Passive Income Sites
        { name: "HoneyGain", category: "Passive Income", paymentProof: "https://i.imgur.com/JZx1WwO.png", description: "Bandwidth sharing for passive income - completely hands-off", minCashout: "$20", trustpilot: "https://www.trustpilot.com/review/honeygain.com", rating: "4.1/5" },
        { name: "Pawns.app", category: "Passive Income", paymentProof: "https://imgur.com/qpjuU0i", description: "Bandwidth sharing and surveys with multiple earning methods", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/pawns.app", rating: "4.2/5" },
        { name: "SerpClix", category: "Passive Income", paymentProof: "https://i.imgur.com/WWTTUoF.png", description: "Website visiting for SEO purposes - simple click tasks", minCashout: "$5", trustpilot: "https://www.trustpilot.com/review/serp-clix.com", rating: "4.0/5" },
        
        // Chat Moderation - UPDATED with verified platforms only
        { name: "Chat-From-Home", category: "Chat Moderation", paymentProof: "https://imgur.com/gallery/chatfromhome2024", description: "UK-focused chat operator platform with reliable payments and 4-star Trustpilot rating", minCashout: "£25", trustpilot: "https://www.trustpilot.com/review/www.chatfromhome.co.uk", rating: "4.0/5" },
        { name: "TexKings", category: "Chat Moderation", paymentProof: "https://imgur.com/gallery/texkings2024", description: "Chat operator platform with 3.8-star Trustpilot rating and regular payments", minCashout: "€100", trustpilot: "https://www.trustpilot.com/review/texkings.com", rating: "3.8/5" },
        
        // Transcription - High-quality only
        { name: "Scribie", category: "Transcription", paymentProof: "https://imgur.com/gallery/scribie2024", description: "AI-assisted transcription with multi-tiered advancement system", minCashout: "$30", trustpilot: "https://www.trustpilot.com/review/scribie.com", rating: "4.2/5" }
    ];

    const categories = [
        { id: 'gpt-microtask', name: 'GPT & Micro-tasks', icon: 'fas fa-tasks', color: 'hsl(50, 100%, 70%)' },
        { id: 'transcription', name: 'Transcription Jobs', icon: 'fas fa-headphones', color: 'hsl(25, 100%, 70%)' },
        { id: 'data-annotation', name: 'Data Annotation', icon: 'fas fa-tag', color: 'hsl(200, 100%, 70%)' },
        { id: 'user-testing', name: 'User Testing', icon: 'fas fa-mouse-pointer', color: 'hsl(260, 100%, 75%)' },
        { id: 'translation', name: 'Translation Jobs', icon: 'fas fa-language', color: 'hsl(190, 100%, 70%)' },
        { id: 'content-writing', name: 'Content Writing', icon: 'fas fa-pen', color: 'hsl(300, 100%, 70%)' },
        { id: 'focus-groups', name: 'Paid Focus Groups', icon: 'fas fa-users', color: 'hsl(140, 100%, 70%)' },
        { id: 'chat-moderation', name: 'Chat Moderation', icon: 'fas fa-comments', color: 'hsl(220, 100%, 70%)' },
        { id: 'virtual-assistant', name: 'Virtual Assistant', icon: 'fas fa-user-tie', color: 'hsl(210, 100%, 75%)' },
        { id: 'online-tutoring', name: 'Online Tutoring', icon: 'fas fa-graduation-cap', color: 'hsl(120, 100%, 70%)' },
        { id: 'passive-income', name: 'Passive Income', icon: 'fas fa-coins', color: 'hsl(45, 100%, 70%)' }
    ];

    const platforms: { [key: string]: Platform[] } = {
        'gpt-microtask': [
            // New high-priority platforms first
            { name: "CashInStyle", description: "Currently offering the highest rates on most offerwalls, beating many established sites with superior compensation.", payRate: "$2 - $15 per hour", requirements: "18+, Global availability", paymentMethods: ["PayPal", "Bitcoin", "Gift Cards"], difficulty: "Beginner", timeCommitment: "2-10 hours per week", pros: ["Highest offerwall rates", "Quick payments", "Excellent support"], cons: ["Newer platform", "Limited history"], tips: "Focus on highest-paying offerwalls, check rates frequently.", url: "https://cashinstyle.com/?ref=687e8a968rijiuu4", trustpilot: "https://www.trustpilot.com/review/cashinstyle.com", rating: "4.8/5", minCashout: "$5" },
            { name: "Gemsloot", description: "New GPT site with live chat support and fair treatment policies, gaining popularity for reliability.", payRate: "$1 - $8 per hour", requirements: "18+, Global availability", paymentMethods: ["PayPal", "Bitcoin", "Gift Cards"], difficulty: "Beginner", timeCommitment: "2-8 hours per week", pros: ["Live chat support", "Fair policies", "Growing community"], cons: ["Newer platform", "Building reputation"], tips: "Engage with live chat for support, participate in community.", url: "https://gemsloot.com/?aff=", trustpilot: "https://www.trustpilot.com/review/gemsloot.com", rating: "4.7/5", minCashout: "$5" },
            { name: "Prime Opinion", description: "Top-tier survey site with a premium user interface, leaderboards, and fast cashouts.", payRate: "$2 - $6 per hour", requirements: "18+, Global availability", paymentMethods: ["PayPal", "Bank Transfer", "Gift Cards"], difficulty: "Beginner", timeCommitment: "2-10 hours per week", pros: ["Excellent UI", "Fast payments", "Good survey inventory"], cons: ["Focus is primarily on surveys"], tips: "Aim for leaderboard bonuses and cash out as soon as you meet the minimum.", url: "https://primeopinion.com", trustpilot: "https://www.trustpilot.com/review/primeopinion.com", rating: "4.6/5", minCashout: "$5" },
            { name: "EarnLab", description: "Rising GPT site being compared to FreeCash with excellent earning potential and user experience.", payRate: "$1.50 - $12 per hour", requirements: "18+, Global availability", paymentMethods: ["PayPal", "Bitcoin", "Gift Cards"], difficulty: "Beginner", timeCommitment: "2-10 hours per week", pros: ["High earning potential", "User-friendly", "Growing reputation"], cons: ["Newer platform", "Limited track record"], tips: "Complete daily tasks, focus on higher-paying activities.", url: "https://earnlab.com", trustpilot: "https://www.trustpilot.com/review/earnlab.com", rating: "4.6/5", minCashout: "$5" },
            { name: "AttaPoll", description: "Popular mobile survey app with good payment proofs and quick, accessible surveys on mobile devices.", payRate: "$1 - $5 per hour", requirements: "18+, Mobile device, Global", paymentMethods: ["PayPal", "Gift Cards"], difficulty: "Beginner", timeCommitment: "1-5 hours per week", pros: ["Mobile-optimized", "Quick surveys", "Low minimum"], cons: ["Mobile only", "Survey limitations"], tips: "Check app frequently, complete profile for better matching.", url: "https://attapoll.app", trustpilot: "https://www.trustpilot.com/review/attapoll.app", rating: "4.5/5", minCashout: "$2.50" },
            { name: "Prize Rebel", description: "Well-established GPT site with bonus codes and reliable payouts, trusted by users for years.", payRate: "$0.50 - $8 per hour", requirements: "13+, Global availability", paymentMethods: ["PayPal", "Gift Cards", "Bitcoin"], difficulty: "Beginner", timeCommitment: "2-8 hours per week", pros: ["Established platform", "Bonus codes", "Multiple payment options"], cons: ["Lower rates on some tasks"], tips: "Use bonus codes, focus on higher-paying tasks.", url: "https://prizerebel.com", trustpilot: "https://www.trustpilot.com/review/prizerebel.com", rating: "4.4/5", minCashout: "$5" },
            { name: "Earn Haus", description: "High-paying product testing and research studies. Opportunities are infrequent but high quality.", payRate: "$10 - $50 per study", requirements: "Varies by study, often US-based", paymentMethods: ["PayPal", "Gift Cards"], difficulty: "Beginner", timeCommitment: "1-5 hours per month", pros: ["High pay per study", "Interesting product tests"], cons: ["Infrequent opportunities", "Competitive to get in"], tips: "Fill out your profile completely and check emails regularly for invites.", url: "https://earnhaus.com", trustpilot: "https://www.trustpilot.com/review/earnhaus.com", rating: "4.4/5", minCashout: "$10" },
            // Existing platforms
            { name: "FreeCash", description: "Top-rated GPT site with multiple earning methods including surveys, tasks, games, and crypto options.", payRate: "$0.50 - $10.00 per task", requirements: "18+, Global (some countries restricted)", paymentMethods: ["PayPal", "Bitcoin", "Bank Transfer", "Gift Cards"], difficulty: "Beginner", timeCommitment: "1-10 hours per week", pros: ["High earning potential", "Multiple earning methods", "Crypto payments"], cons: ["Some tasks require patience", "Geographic restrictions"], tips: "Focus on higher-paying tasks and complete daily bonuses.", url: "https://freecash.com/r/LVXIF", trustpilot: "https://www.trustpilot.com/review/freecash.com", rating: "4.6/5", minCashout: "$5" },
            { name: "Reward XP", description: "Gaming-focused rewards platform with high-paying game offers and active Discord community.", payRate: "$2 - $10 per hour", requirements: "18+, Global availability", paymentMethods: ["PayPal", "Bitcoin", "Gift Cards"], difficulty: "Beginner", timeCommitment: "2-8 hours per week", pros: ["High-paying game offers", "Gaming community", "Various earning methods"], cons: ["Fewer options for non-gamers"], tips: "Focus on game offers for highest earnings and join Discord community for tips.", url: "https://rewardxp.com", trustpilot: "https://www.trustpilot.com/review/rewardxp.com", rating: "4.5/5", minCashout: "$5" },
            { name: "Gain.gg", description: "Modern GPT site with focus on quick crypto payouts and wide range of offer walls.", payRate: "$2 - $8 per hour", requirements: "18+, Global availability", paymentMethods: ["Bitcoin", "Ethereum", "PayPal"], difficulty: "Beginner", timeCommitment: "2-6 hours per week", pros: ["Fast crypto payouts", "Low withdrawal minimum", "Great offer selection"], cons: ["Main focus on crypto"], tips: "Use crypto payouts for fastest processing and check multiple offer walls.", url: "https://gain.gg/r/108056722426962466301", trustpilot: "https://www.trustpilot.com/review/gain.gg", rating: "4.5/5", minCashout: "$1" },
            { name: "PaidViewpoint", description: "Unique survey platform that guarantees no screener-outs. Build TraitScore for better pay.", payRate: "$2 - $5 per hour", requirements: "18+, Global availability", paymentMethods: ["PayPal"], difficulty: "Beginner", timeCommitment: "1-3 hours per week", pros: ["Never screened out", "Clean interface", "High trust score"], cons: ["Lower earning potential", "Fewer surveys"], tips: "Be consistent to build TraitScore for higher-paying surveys.", url: "https://paidviewpoint.com", trustpilot: "https://www.trustpilot.com/review/paidviewpoint.com", rating: "4.5/5", minCashout: "$15" },
            { name: "ySense", description: "Long-established GPT platform with surveys, tasks, and offers. Reliable payouts and good international availability.", payRate: "$0.30 - $5.00 per survey", requirements: "18+, Global availability", paymentMethods: ["PayPal", "Payoneer", "Skrill"], difficulty: "Beginner", timeCommitment: "2-8 hours per week", pros: ["Reliable payments", "Multiple earning methods"], cons: ["Lower pay rates", "Survey disqualifications"], tips: "Complete daily checklist for bonuses and focus on tasks over surveys.", url: "https://www.ysense.com", trustpilot: "https://www.trustpilot.com/review/ysense.com", rating: "4.2/5", minCashout: "$5" },
            { name: "Swagbucks", description: "Most popular GPT site with surveys, videos, shopping cashback, and web searching rewards.", payRate: "$0.40 - $2.00 per survey", requirements: "13+, US/CA/UK/AU/DE/FR/ES/IE", paymentMethods: ["PayPal", "Gift Cards"], difficulty: "Beginner", timeCommitment: "1-5 hours per week", pros: ["Low minimum payout", "Multiple earning methods", "Mobile app"], cons: ["Low pay rates", "Account deactivation risk"], tips: "Use desktop for better survey access, complete daily goals.", url: "https://www.swagbucks.com", trustpilot: "https://www.trustpilot.com/review/swagbucks.com", rating: "4.3/5", minCashout: "$3" },
            { name: "Clickworker", description: "Professional micro-task platform with UHRS access and data collection tasks.", payRate: "$9 - $16 per hour equivalent", requirements: "18+, Pass assessments", paymentMethods: ["PayPal", "Bank Transfer", "Payoneer"], difficulty: "Intermediate", timeCommitment: "5-40 hours per week", pros: ["Good hourly rates", "UHRS access", "Professional tasks"], cons: ["Qualification tests", "Task availability varies"], tips: "Complete all assessments, maintain high quality scores.", url: "https://www.clickworker.com", trustpilot: "https://www.trustpilot.com/review/clickworker.com", rating: "4.1/5", minCashout: "$5" },
            { name: "Keep Rewarding", description: "Classic GPT site with very low payout threshold and consistent earning opportunities.", payRate: "$0.50 - $5 per hour", requirements: "18+, Global availability", paymentMethods: ["PayPal", "Gift Cards"], difficulty: "Beginner", timeCommitment: "1-6 hours per week", pros: ["Very low minimum", "Simple interface", "Reliable payments"], cons: ["Lower earning potential"], tips: "Focus on daily tasks, cash out frequently.", url: "https://keeprewarding.com", trustpilot: null, rating: "4.0/5", minCashout: "$1" },
            { name: "Timebucks", description: "Global GPT site with vast range of unique tasks and good payment record.", payRate: "$1 - $6 per hour", requirements: "18+, Global availability", paymentMethods: ["PayPal", "Bitcoin", "Bank Transfer"], difficulty: "Beginner", timeCommitment: "2-8 hours per week", pros: ["Multiple earning methods", "Global availability", "Regular payments"], cons: ["Time-intensive", "Lower rates"], tips: "Use multiple earning methods, be consistent.", url: "https://timebucks.com", trustpilot: "https://www.trustpilot.com/review/timebucks.com", rating: "4.3/5", minCashout: "$10" },
            { name: "InboxDollars", description: "Classic GPT site with various ways to earn, including surveys, videos, and games. Owned by Prodege (Swagbucks).", payRate: "$0.50 - $3 per hour", requirements: "18+, US-based", paymentMethods: ["PayPal", "Check", "Gift Cards"], difficulty: "Beginner", timeCommitment: "2-8 hours per week", pros: ["Variety of tasks", "Sign-up bonus"], cons: ["High cashout minimum ($30)", "Low pay rates"], tips: "Focus on completing the sign-up bonus requirements first.", url: "https://www.inboxdollars.com", trustpilot: "https://www.trustpilot.com/review/inboxdollars.com", rating: "4.0/5", minCashout: "$30" },
            { name: "MyPoints.com", description: "Rewards site focused on shopping cashback but also offers surveys and videos. Part of the Prodege network.", payRate: "$1 - $4 per hour", requirements: "18+, US/Canada", paymentMethods: ["PayPal", "Gift Cards"], difficulty: "Beginner", timeCommitment: "2-8 hours per week", pros: ["Good shopping cashback", "Many reward options"], cons: ["Survey earnings are low", "Points can be confusing"], tips: "Best used for online shopping cashback; supplement with surveys.", url: "https://www.mypoints.com", trustpilot: "https://www.trustpilot.com/review/mypoints.com", rating: "4.0/5", minCashout: "$10" },
            { name: "Toluna", description: "Global survey community platform with a wide range of survey topics and product testing.", payRate: "$1 - $4 per hour", requirements: "16+, Global availability", paymentMethods: ["PayPal", "Gift Cards"], difficulty: "Beginner", timeCommitment: "3-10 hours per week", pros: ["Large survey inventory", "Community features"], cons: ["Point system can be slow", "Disqualifications common"], tips: "Engage in community polls to earn extra points.", url: "https://www.toluna.com", trustpilot: "https://www.trustpilot.com/review/toluna.com", rating: "3.9/5", minCashout: "$10" },
            { name: "sproutgigs", description: "Micro-task marketplace where users complete small online jobs for payment. Formerly Picoworkers.", payRate: "$2 - $8 per hour", requirements: "18+, Global availability", paymentMethods: ["PayPal", "Skrill", "Crypto"], difficulty: "Beginner to Intermediate", timeCommitment: "5-20 hours per week", pros: ["Huge variety of tasks", "Low cashout minimum"], cons: ["Many low-paying tasks", "Quality can be mixed"], tips: "Filter for higher-paying tasks and build a good success rate.", url: "https://sproutgigs.com", trustpilot: "https://www.trustpilot.com/review/sproutgigs.com", rating: "3.8/5", minCashout: "$5" },
            { name: "Paidwork", description: "Mobile-focused platform for earning by playing games, watching videos, and taking surveys.", payRate: "$0.50 - $5 per hour", requirements: "18+, Global availability, Mobile device", paymentMethods: ["PayPal", "Bank Transfer"], difficulty: "Beginner", timeCommitment: "2-10 hours per week", pros: ["Mobile-friendly", "Variety of simple tasks"], cons: ["Earnings can be very slow", "High minimum payout"], tips: "Best for casual earning on your phone, not for significant income.", url: "https://www.paidwork.com/?r=sammarkey44", trustpilot: "https://www.trustpilot.com/review/paidwork.com", rating: "3.7/5", minCashout: "$10" }
        ],
        'transcription': [
            { name: "Rev", description: "Leading transcription platform with flexible scheduling and weekly payments.", payRate: "$0.30 - $1.10 per audio minute", requirements: "Typing test, English proficiency", paymentMethods: ["PayPal"], difficulty: "Intermediate", timeCommitment: "5-40 hours per week", pros: ["Weekly payments", "Flexible hours", "Good support"], cons: ["Low starting pay", "Strict quality standards"], tips: "Start with shorter files, maintain high ratings.", url: "https://www.rev.com", trustpilot: "https://www.trustpilot.com/review/rev.com", rating: "4.5/5", minCashout: "$10" },
            { name: "TranscribeMe", warning: "This platform has an extremely poor user rating on Trustpilot. Users frequently report serious issues, including non-payment, unfair account suspensions, and unresponsive customer support. Proceed with extreme caution.", description: "Short audio segments platform perfect for beginners and part-time work.", payRate: "$15 - $22 per audio hour", requirements: "Typing test, grammar test", paymentMethods: ["PayPal"], difficulty: "Beginner", timeCommitment: "2-20 hours per week", pros: ["Short segments", "Good for beginners", "Weekly payments"], cons: ["Low per-minute rate", "Limited availability"], tips: "Work during peak hours, maintain accuracy over speed.", url: "https://www.transcribeme.com", trustpilot: "https://www.trustpilot.com/review/transcribeme.com", rating: "1.5/5", minCashout: "$20" },
            { name: "GoTranscript", description: "International transcription platform with competitive rates and good availability.", payRate: "$0.60 - $1.25 per audio minute", requirements: "English test, sample transcription", paymentMethods: ["PayPal", "Payoneer"], difficulty: "Intermediate", timeCommitment: "10-40 hours per week", pros: ["Better pay rates", "Weekly payments", "International accepted"], cons: ["Quality requirements", "Strict deadlines"], tips: "Focus on accuracy, use proper formatting.", url: "https://gotranscript.com", trustpilot: "https://www.trustpilot.com/review/gotranscript.com", rating: "4.2/5", minCashout: "$5" },
            { name: "Scribie", description: "Provides AI-generated transcript that you edit, with multi-tiered advancement system.", payRate: "$5 - $20 per audio hour", requirements: "English proficiency", paymentMethods: ["PayPal"], difficulty: "Beginner", timeCommitment: "5-30 hours per week", pros: ["AI-generated starting transcript", "Bonus pay system", "Good for beginners"], cons: ["Very low base pay", "Strict grading"], tips: "Focus on accuracy to advance tiers.", url: "https://scribie.com", trustpilot: "https://www.trustpilot.com/review/scribie.com", rating: "4.2/5", minCashout: "$30" },
            { name: "CastingWords", description: "Grading system where better work unlocks higher pay rates.", payRate: "$0.08 - $1.00+ per audio minute", requirements: "No upfront test required", paymentMethods: ["PayPal"], difficulty: "Intermediate", timeCommitment: "5-40 hours per week", pros: ["Work for various skill levels", "Bonuses for quality"], cons: ["Very strict grading", "Low pay for beginners"], tips: "Focus on accuracy over speed for better opportunities.", url: "https://castingwords.com", trustpilot: "https://www.trustpilot.com/review/castingwords.com", rating: "3.5/5", minCashout: "$1" },
            { name: "SpeakWrite", description: "Platform for fast typists focusing on legal and general transcription.", payRate: "$0.005 - $0.006 per word", requirements: "60+ WPM, US/Canada resident", paymentMethods: ["Direct Deposit"], difficulty: "Advanced", timeCommitment: "10-40 hours per week", pros: ["Higher pay rates", "Consistent work", "Professional focus"], cons: ["Fast typing required", "Geographic restrictions"], tips: "Maintain typing speed, focus on accuracy.", url: "https://speakwrite.com", trustpilot: "https://www.trustpilot.com/review/speakwrite.com", rating: "3.9/5", minCashout: "$30" }
        ],
        'data-annotation': [
            // New high-priority platforms including Stellar AI
            { name: "DataAnnotation.tech", caution: "This platform has mixed user reviews. While some users report positive experiences, there are also significant complaints regarding issues like sudden account terminations, inconsistent work, and poor communication. Please research recent user feedback before investing time.", description: "Premium AI training platform with excellent pay for complex tasks, highest rates in industry.", payRate: "$20 - $26.50 per hour", requirements: "Rigorous assessment, specialized skills", paymentMethods: ["PayPal"], difficulty: "Expert", timeCommitment: "10-40 hours per week", pros: ["Very high pay", "Complex tasks", "Quality focus"], cons: ["Very difficult acceptance", "Work not always available"], tips: "Pass assessment thoroughly, maintain quality.", url: "https://www.dataannotation.tech", trustpilot: "https://www.trustpilot.com/review/dataannotation.tech", rating: "3.2/5", minCashout: "$5" },
            { name: "Outlier AI", description: "Scale AI subsidiary focusing on AI training tasks with higher rates than previous Remotasks.", payRate: "$15 - $60 per hour", requirements: "Pass assessments, various expertise levels", paymentMethods: ["PayPal", "AirTM", "Bank Transfer"], difficulty: "Expert", timeCommitment: "10-40 hours per week", pros: ["High pay for specialized tasks", "Weekly payments", "Variety of tasks"], cons: ["Inconsistent work availability", "Strict quality standards"], tips: "Specialize in high-paying categories, maintain quality scores.", url: "https://outlier.ai", trustpilot: "https://www.trustpilot.com/review/outlier.ai", rating: "4.0/5", minCashout: "$5" },
            { name: "Stellar AI", description: "New premium data annotation platform with competitive rates for AI training and machine learning projects.", payRate: "$18 - $35 per hour", requirements: "Technical assessment, attention to detail", paymentMethods: ["PayPal", "Direct Deposit"], difficulty: "Expert", timeCommitment: "15-40 hours per week", pros: ["Competitive rates", "Growing platform", "Quality projects"], cons: ["New platform", "Limited availability"], tips: "Complete technical assessment thoroughly, focus on accuracy.", url: "https://stellar.ai", trustpilot: "https://www.trustpilot.com/review/stellar.ai", rating: "4.2/5", minCashout: "$10" },
            { name: "Verasight", description: "Data annotation platform mentioned frequently in recent earning reports with good rates.", payRate: "$12 - $22 per hour", requirements: "Assessment completion, attention to detail", paymentMethods: ["PayPal", "Direct Deposit"], difficulty: "Intermediate to Advanced", timeCommitment: "10-30 hours per week", pros: ["Consistent work", "Good support", "Fair rates"], cons: ["Application process", "Quality requirements"], tips: "Focus on accuracy, complete training thoroughly.", url: "https://verasight.com", trustpilot: "https://www.trustpilot.com/review/verasight.com", rating: "4.1/5", minCashout: "$10" },
            // Existing platforms
            { name: "Scale AI", description: "High-end platform delivering datasets for advanced AI models with selective acceptance.", payRate: "$15 - $25+ per hour", requirements: "Specialized skills, high accuracy", paymentMethods: ["Direct Deposit"], difficulty: "Expert", timeCommitment: "10-40 hours per week", pros: ["Very high pay", "Cutting-edge projects", "Quality focus"], cons: ["Extremely difficult acceptance", "Requires expertise"], tips: "Demonstrate expertise clearly, maintain perfect accuracy.", url: "https://scale.com", trustpilot: "https://www.trustpilot.com/review/scale.com", rating: "4.0/5", minCashout: "$25" },
            { name: "Remotasks", description: "AI training platform with comprehensive training and various task types.", payRate: "$3 - $25 per hour", requirements: "Complete training courses", paymentMethods: ["PayPal"], difficulty: "Beginner to Advanced", timeCommitment: "5-40 hours per week", pros: ["Training provided", "Various task types", "Scaling opportunities"], cons: ["Variable pay", "Task competition"], tips: "Complete all training courses, specialize in high-paying tasks.", url: "https://www.remotasks.com", trustpilot: "https://www.trustpilot.com/review/remotasks.com", rating: "3.8/5", minCashout: "$5" },
            { name: "Telus International", description: "Global company offering data annotation, AI training, and search evaluation roles. Formerly Lionbridge AI. Work can be inconsistent.", payRate: "$12 - $15 per hour", requirements: "Bachelor's degree preferred, location-specific", paymentMethods: ["Direct Deposit"], difficulty: "Intermediate", timeCommitment: "10-20 hours per week", pros: ["Good hourly rate", "Stable work when available", "Professional environment"], cons: ["Inconsistent work availability", "Geographic restrictions"], tips: "Apply for multiple projects, maintain high quality scores.", url: "https://jobs.telusinternational.com", trustpilot: "https://www.trustpilot.com/review/telusinternational.com", rating: "3.8/5", minCashout: "$20" }
        ],
        'user-testing': [
            { name: "Google User Research", description: "Participate in research studies directly from Google to help improve their products. Very high pay and trustworthy.", payRate: "$75 - $120 per hour", requirements: "Varies, sign-up required", paymentMethods: ["Gift Cards", "Direct Deposit"], difficulty: "Beginner", timeCommitment: "1-2 hours per study", pros: ["Extremely high pay", "Work with Google", "Interesting studies"], cons: ["Very few opportunities", "High competition"], tips: "Sign up and fill out your profile in detail to get matched.", url: "https://userresearch.google.com/", trustpilot: null, rating: "4.9/5", minCashout: "$50" },
            // New high-priority platforms
            { name: "TestingTime", description: "European-focused platform with very high pay rates for moderated studies and professional testing.", payRate: "Up to €50 per hour", requirements: "European location preferred", paymentMethods: ["PayPal", "Bank Transfer"], difficulty: "Intermediate", timeCommitment: "2-8 hours per week", pros: ["Very high pay", "Professional studies", "Well-organized"], cons: ["Primarily European", "Limited opportunities"], tips: "Commit to scheduled times, be professional.", url: "https://www.testingtime.com", trustpilot: "https://www.trustpilot.com/review/testingtime.com", rating: "4.6/5", minCashout: "$10" },
            { name: "PingPong", description: "US-focused user testing platform with good rates and regular opportunities.", payRate: "$10 - $50 per test", requirements: "US-based, good communication skills", paymentMethods: ["PayPal"], difficulty: "Beginner to Intermediate", timeCommitment: "2-8 hours per week", pros: ["US-focused", "Regular opportunities", "Good pay"], cons: ["Geographic restriction", "Limited to US"], tips: "Be detailed in feedback, follow instructions carefully.", url: "https://www.pingpong.com", trustpilot: "https://www.trustpilot.com/review/pingpong.com", rating: "4.3/5", minCashout: "$10" },
            { name: "Pulse Labs", description: "AI-powered UX research platform with 1-8 week studies and premium compensation.", payRate: "$25 - $200 per study", requirements: "Various demographics, long-term commitment", paymentMethods: ["PayPal", "Check"], difficulty: "Intermediate", timeCommitment: "5-20 hours per study", pros: ["High compensation", "Long-term studies", "AI-powered matching"], cons: ["Time commitment", "Study duration"], tips: "Commit to full study duration, provide detailed insights.", url: "https://www.pulselabs.ai", trustpilot: "https://www.trustpilot.com/review/pulselabs.ai", rating: "4.4/5", minCashout: "$25" },
            // Existing platforms
            { name: "UserTesting", description: "Premier usability testing platform with high pay per test.", payRate: "$10 - $60 per test", requirements: "Microphone, device with screen recording", paymentMethods: ["PayPal"], difficulty: "Beginner", timeCommitment: "2-10 hours per week", pros: ["High pay per test", "Flexible timing", "Interesting work"], cons: ["Inconsistent availability", "Rating affects opportunities"], tips: "Give detailed feedback, follow instructions carefully.", url: "https://www.usertesting.com", trustpilot: "https://www.trustpilot.com/review/usertesting.com", rating: "4.5/5", minCashout: "$10" },
            { name: "Userlytics", description: "User experience testing with various test formats and global reach.", payRate: "$5 - $90 per test", requirements: "Microphone, webcam, stable internet", paymentMethods: ["PayPal"], difficulty: "Beginner", timeCommitment: "2-10 hours per week", pros: ["Good pay rates", "Web and mobile tests", "Global platform"], cons: ["Fewer tests than UserTesting", "Interface issues"], tips: "Complete qualification thoroughly, provide constructive feedback.", url: "https://www.userlytics.com", trustpilot: "https://www.trustpilot.com/review/userlytics.com", rating: "4.2/5", minCashout: "$5" },
            { name: "Trymata", description: "Straightforward platform with simple test format and weekly payments.", payRate: "$5 - $30 per test", requirements: "Microphone, stable internet", paymentMethods: ["PayPal"], difficulty: "Beginner", timeCommitment: "1-5 hours per week", pros: ["Easy to start", "Weekly payments", "Simple format"], cons: ["Lower average pay", "Fewer tests"], tips: "Speak clearly, provide constructive feedback.", url: "https://trymata.com", trustpilot: "https://www.trustpilot.com/review/trymata.com", rating: "4.0/5", minCashout: "$10" },
            { name: "Userfeel", description: "Global platform paying based on test length with multi-language support.", payRate: "$3 - $30 per test", requirements: "Qualification test passage", paymentMethods: ["PayPal"], difficulty: "Intermediate", timeCommitment: "2-10 hours per week", pros: ["Pay per 5 minutes", "Multiple languages", "Good support"], cons: ["Qualification test required", "Fewer opportunities"], tips: "Pass qualification carefully, provide detailed feedback.", url: "https://www.userfeel.com", trustpilot: "https://www.trustpilot.com/review/userfeel.com", rating: "4.4/5", minCashout: "$10" },
            { name: "Ascendancy Research", description: "Market research company that conducts paid user interviews and focus groups.", payRate: "$50 - $150 per study", requirements: "Varies by study, demographic matching", paymentMethods: ["PayPal", "Gift Cards"], difficulty: "Beginner", timeCommitment: "1-3 hours per study", pros: ["Good pay rates", "Professional studies"], cons: ["Fewer opportunities", "Screening process"], tips: "Respond to study invites quickly as spots fill up fast.", url: "https://www.ascendaresearch.com", trustpilot: "https://www.trustpilot.com/review/ascendaresearch.com", rating: "4.2/5", minCashout: "$50" },
            { name: "WatchLab.com", description: "Conducts paid market research studies for a wide range of consumer products and services.", payRate: "$50 - $200 per study", requirements: "Varies by study, often city-specific", paymentMethods: ["Check", "Gift Card"], difficulty: "Beginner", timeCommitment: "1-4 hours per study", pros: ["High pay", "Reputable clients"], cons: ["Often requires being in a specific city", "Competitive"], tips: "Sign up for their panel and keep your profile updated.", url: "https://www.watchlab.com", trustpilot: "https://www.trustpilot.com/review/watchlab.com", rating: "4.3/5", minCashout: "$50" }
        ],
        'translation': [
            { name: "ProZ.com", description: "World's largest community and marketplace for language professionals.", payRate: "Set your own rates", requirements: "Professional experience, membership often required", paymentMethods: ["Various, client-dependent"], difficulty: "Professional", timeCommitment: "Variable", pros: ["Largest community", "Networking opportunities", "Job board access"], cons: ["Membership costs", "High competition"], tips: "Build strong profile, network actively.", url: "https://www.proz.com", trustpilot: "https://www.trustpilot.com/review/proz.com", rating: "4.5/5", minCashout: "$1" },
            { name: "Gengo", description: "Professional translation platform serving global businesses.", payRate: "$0.03 - $0.17 per word", requirements: "Bilingual proficiency, translation tests", paymentMethods: ["PayPal", "Skrill", "Payoneer"], difficulty: "Intermediate", timeCommitment: "5-40 hours per week", pros: ["Flexible schedule", "Various language pairs", "Quality feedback"], cons: ["Competitive selection", "Rate varies by language"], tips: "Specialize in specific domains, maintain high quality ratings.", url: "https://gengo.com", trustpilot: "https://www.trustpilot.com/review/gengo.com", rating: "4.0/5", minCashout: "$10" },
            { name: "Unbabel", description: "AI-assisted translation platform for enterprise clients.", payRate: "$8 - $20 per hour equivalent", requirements: "Language assessment, specific language pairs", paymentMethods: ["PayPal"], difficulty: "Advanced", timeCommitment: "10-30 hours per week", pros: ["AI assistance", "Enterprise clients", "Good rates"], cons: ["Limited language pairs", "High quality standards"], tips: "Focus on post-editing speed while maintaining accuracy.", url: "https://unbabel.com", trustpilot: "https://www.trustpilot.com/review/unbabel.com", rating: "3.8/5", minCashout: "$25" },
            { name: "TextMaster", description: "European-based service with tiered system for pay advancement.", payRate: "Up to €0.15 per word", requirements: "Quality assessments, level progression", paymentMethods: ["PayPal", "Bank Transfer"], difficulty: "Intermediate to Advanced", timeCommitment: "5-40 hours per week", pros: ["Tiered advancement", "European focus", "User-friendly interface"], cons: ["Difficult to advance", "Lower initial rates"], tips: "Focus on quality to advance levels.", url: "https://www.textmaster.com", trustpilot: "https://www.trustpilot.com/review/textmaster.com", rating: "4.1/5", minCashout: "€50" }
        ],
        'content-writing': [
            // New high-priority platforms
            { name: "ContentWriters", description: "Professional content agency with specialized writers network and excellent hourly rates.", payRate: "$22 - $44 per hour", requirements: "Portfolio, writing expertise, professional background", paymentMethods: ["Direct Deposit"], difficulty: "Expert", timeCommitment: "10-40 hours per week", pros: ["Very high hourly rates", "Professional environment", "Established clients"], cons: ["Extremely selective", "High standards"], tips: "Demonstrate expertise in specific niches, maintain professional quality.", url: "https://contentwriters.com", trustpilot: "https://www.trustpilot.com/review/contentwriters.com", rating: "4.7/5", minCashout: "$25" },
            { name: "ClearVoice", description: "Premium content marketing platform connecting brands with creators and top-tier writers.", payRate: "Set your own rates", requirements: "Portfolio, brand alignment, professional background", paymentMethods: ["Direct Payment"], difficulty: "Advanced", timeCommitment: "10-40 hours per week", pros: ["Work with major brands", "Set own rates", "Professional network"], cons: ["Competitive selection", "Brand requirements"], tips: "Build strong portfolio, align with premium brands.", url: "https://www.clearvoice.com", trustpilot: "https://www.trustpilot.com/review/clearvoice.com", rating: "4.5/5", minCashout: "$25" },
            { name: "Crowd Content", description: "Content marketplace with various writing opportunities and flexible pricing.", payRate: "$15 - $50 per article", requirements: "Writing samples, approval process", paymentMethods: ["PayPal"], difficulty: "Intermediate", timeCommitment: "5-30 hours per week", pros: ["Marketplace model", "Various content types", "Flexible pricing"], cons: ["Commission fees", "Competition"], tips: "Specialize in profitable niches, build client relationships.", url: "https://www.crowdcontent.com", trustpilot: "https://www.trustpilot.com/review/crowdcontent.com", rating: "4.2/5", minCashout: "$25" },
            { name: "WordAgents", description: "Content writing service with freelancer network focused on SEO and marketing content.", payRate: "$20 - $100 per article", requirements: "SEO knowledge preferred, writing portfolio", paymentMethods: ["PayPal", "Direct Deposit"], difficulty: "Intermediate to Advanced", timeCommitment: "10-30 hours per week", pros: ["SEO-focused content", "Good rates", "Regular work"], cons: ["SEO knowledge required", "Quality standards"], tips: "Develop SEO expertise, focus on marketing content.", url: "https://www.wordagents.com", trustpilot: "https://www.trustpilot.com/review/wordagents.com", rating: "4.3/5", minCashout: "$25" },
            // Existing platforms
            { name: "WriterAccess", description: "Premium content creation platform for marketing agencies.", payRate: "$0.02 - $2.00 per word", requirements: "Portfolio, writing tests", paymentMethods: ["Direct Deposit", "PayPal"], difficulty: "Advanced", timeCommitment: "10-40 hours per week", pros: ["High earning potential", "Direct client relationships", "Professional environment"], cons: ["Competitive application", "Performance-based ratings"], tips: "Build strong portfolio, maintain high quality scores.", url: "https://www.writeraccess.com", trustpilot: "https://www.trustpilot.com/review/writeraccess.com", rating: "4.6/5", minCashout: "$10" },
            { name: "nDash", description: "Unique platform where writers pitch content ideas directly to brands.", payRate: "Set your own rates", requirements: "Portfolio, professional background", paymentMethods: ["Direct payment"], difficulty: "Intermediate", timeCommitment: "Variable", pros: ["Set own prices", "Direct brand pitching", "High-quality brands"], cons: ["No guaranteed work", "Requires active pitching"], tips: "Pitch relevant, timely ideas, build relationships with brands.", url: "https://www.ndash.com", trustpilot: "https://www.trustpilot.com/review/ndash.com", rating: "4.5/5", minCashout: "$1" },
            { name: "Verblio", description: "Content creation platform focused on blog posts and SEO content.", payRate: "$20 - $300+ per article", requirements: "Difficult grammar test, writing samples", paymentMethods: ["PayPal"], difficulty: "Advanced", timeCommitment: "5-40 hours per week", pros: ["Good variety of clients", "Level up opportunities", "Supportive community"], cons: ["Speculative work", "Difficult entry test"], tips: "Pass grammar test carefully, focus on SEO knowledge.", url: "https://www.verblio.com", trustpilot: "https://www.trustpilot.com/review/verblio.com", rating: "4.2/5", minCashout: "$10" },
            { name: "Constant Content", description: "Marketplace for selling pre-written articles or custom content requests.", payRate: "Set your own price", requirements: "Writing portfolio, quality standards", paymentMethods: ["PayPal"], difficulty: "Intermediate", timeCommitment: "Variable", pros: ["Set own prices", "Marketplace model", "Custom requests"], cons: ["35% commission", "No guarantee of sales"], tips: "Research popular topics, price competitively.", url: "https://www.constant-content.com", trustpilot: "https://www.trustpilot.com/review/constant-content.com", rating: "4.1/5", minCashout: "$25" }
        ],
        'focus-groups': [
            // New high-priority platforms
            { name: "Cloud Connect Research", description: "Highly mentioned in earning reports with potential for $300+ monthly earnings from premium studies.", payRate: "$75 - $300+ per study", requirements: "Various demographics, professional backgrounds", paymentMethods: ["PayPal", "Check"], difficulty: "Beginner", timeCommitment: "2-8 hours per study", pros: ["Very high earnings potential", "Premium studies", "Regular opportunities"], cons: ["Competitive selection", "Demographic requirements"], tips: "Complete profile thoroughly, respond quickly to invitations.", url: "https://cloudconnectresearch.com", trustpilot: "https://www.trustpilot.com/review/cloudconnectresearch.com", rating: "4.3/5", minCashout: "$75" },
            { name: "Instapanel", caution: "This platform has mixed user reviews. While some users report positive experiences, there are also significant complaints regarding issues like sudden account terminations, inconsistent work, and poor communication. Please research recent user feedback before investing time.", description: "Research community platform with regular study opportunities and good compensation.", payRate: "$50 - $200 per study", requirements: "Various demographics, active participation", paymentMethods: ["PayPal", "Gift Cards"], difficulty: "Beginner", timeCommitment: "1-6 hours per study", pros: ["Regular opportunities", "Community aspect", "Good rates"], cons: ["Time commitment", "Screening requirements"], tips: "Stay active in community, complete profile updates.", url: "https://instapanel.com", trustpilot: "https://www.trustpilot.com/review/instapanel.com", rating: "3.5/5", minCashout: "$50" },
            { name: "SunZone Community", description: "Product testing community via MyPoints with physical product testing opportunities.", payRate: "$25 - $150 per test", requirements: "Product testing interest, US-based", paymentMethods: ["Gift Cards", "PayPal"], difficulty: "Beginner", timeCommitment: "2-4 hours per test", pros: ["Keep products", "Interesting testing", "Good compensation"], cons: ["Limited availability", "Geographic restrictions"], tips: "Be detailed in reviews, participate regularly.", url: "https://sunzonecommunity.com", trustpilot: "https://www.trustpilot.com/review/sunzonecommunity.com", rating: "4.1/5", minCashout: "$25" },
            // Existing platforms
            { name: "Respondent", description: "Premium research platform with high-paying B2B and consumer studies.", payRate: "$50 - $500+ per study", requirements: "Varies by study demographics, Global availability", paymentMethods: ["PayPal"], difficulty: "Beginner", timeCommitment: "1-10 hours per month", pros: ["Very high pay", "Interesting topics", "Professional studies"], cons: ["Selective screening", "Competition"], tips: "Apply quickly, keep profile detailed and updated.", url: "https://www.respondent.io", trustpilot: "https://www.trustpilot.com/review/respondent.io", rating: "4.2/5", minCashout: "$5" },
            { name: "User Interviews", description: "Tech-focused user research platform with good compensation.", payRate: "$50 - $200+ per session", requirements: "Various professional backgrounds, US/Canada", paymentMethods: ["PayPal", "Amazon Gift Cards"], difficulty: "Beginner", timeCommitment: "1-5 hours per month", pros: ["Good compensation", "Tech-focused", "Flexible scheduling"], cons: ["Competitive selection", "Specific demographics"], tips: "Complete profile thoroughly, respond promptly.", url: "https://www.userinterviews.com", trustpilot: "https://www.trustpilot.com/review/userinterviews.com", rating: "4.5/5", minCashout: "$10" },
            { name: "Fieldwork", description: "Veteran market research company with high-paying in-person focus groups.", payRate: "$75 - $200+ per study", requirements: "Demographic matching, US-based", paymentMethods: ["Visa Gift Card", "Check"], difficulty: "Beginner", timeCommitment: "2-6 hours per study", pros: ["High pay", "Reputable company", "Professional facilities"], cons: ["In-person only", "Limited to major cities"], tips: "Sign up for multiple locations, arrive early.", url: "https://www.fieldwork.com", trustpilot: "https://www.trustpilot.com/review/fieldwork.com", rating: "4.3/5", minCashout: "$75" },
            { name: "Focus Group by Sago", description: "Top-tier market research company conducting premium focus groups.", payRate: "$75 - $300 per study", requirements: "Various demographics, Global availability", paymentMethods: ["PayPal", "Check", "Gift Cards"], difficulty: "Beginner", timeCommitment: "2-6 hours per study", pros: ["Major industry leader", "High-quality studies", "Excellent pay"], cons: ["Competitive selection", "Limited locations for in-person"], tips: "Maintain professional demeanor, be punctual.", url: "https://www.sago.com", trustpilot: "https://www.trustpilot.com/review/sago.com", rating: "4.4/5", minCashout: "$50" }
        ],
        'chat-moderation': [
            // High-quality, verified platforms
            { name: "Chat-From-Home", description: "UK-focused chat operator platform for premium adult entertainment with excellent 4-star Trustpilot rating and reliable payments.", payRate: "10-17p per minute", requirements: "UK-based, English proficiency, 18+", paymentMethods: ["PayPal", "Bank Transfer"], difficulty: "Beginner", timeCommitment: "Flexible hours", pros: ["4-star Trustpilot rating", "Reliable payments", "Good training provided"], cons: ["UK market focus only", "Adult content"], tips: "Follow UK market preferences, maintain engaging conversations, be professional.", url: "https://www.chatfromhome.co.uk", trustpilot: "https://www.trustpilot.com/review/www.chatfromhome.co.uk", rating: "4.0/5", minCashout: "£25" },
            { name: "TexKings", description: "Established chat operator platform with 3.8-star Trustpilot rating, offering text chat services across multiple languages.", payRate: "€0.02 - €0.08 per message", requirements: "18+, Good communication skills, Multiple languages available", paymentMethods: ["PayPal", "Bank Transfer"], difficulty: "Beginner", timeCommitment: "Flexible hours", pros: ["3.8-star Trustpilot rating", "Multiple language options", "Regular payments"], cons: ["Adult content", "Variable message rates"], tips: "Build regular client base, focus on quality conversations, work consistent hours.", url: "https://texkings.com", trustpilot: "https://www.trustpilot.com/review/texkings.com", rating: "3.8/5", minCashout: "€100" },
            { name: "LiveWorld", description: "Professional social media moderation and community management for major brands - legitimate corporate environment.", payRate: "$11 - $16 per hour", requirements: "Social media experience, US-based, professional background", paymentMethods: ["Direct Deposit"], difficulty: "Intermediate", timeCommitment: "15-40 hours per week", pros: ["Professional environment", "Major brand clients", "Hourly pay structure", "Career advancement"], cons: ["Geographic restriction to US", "Performance monitoring"], tips: "Demonstrate social media knowledge, maintain professional standards, focus on brand safety.", url: "https://www.liveworld.com", trustpilot: "https://www.trustpilot.com/review/liveworld.com", rating: "4.0/5", minCashout: "$50" },
            { name: "ModSquad", description: "Established content moderation company providing services for major tech platforms and gaming companies.", payRate: "$12 - $18 per hour", requirements: "Content moderation experience, pass assessments, various locations", paymentMethods: ["Direct Deposit"], difficulty: "Intermediate", timeCommitment: "20-40 hours per week", pros: ["Major tech clients", "Professional moderation work", "Growth opportunities", "Established company"], cons: ["Competitive application", "Minimum hour requirements"], tips: "Highlight specific moderation skills, maintain quality standards, specialize in platform types.", url: "https://modsquad.com", trustpilot: "https://www.trustpilot.com/review/modsquad.com", rating: "4.1/5", minCashout: "N/A" },
            // Added platforms with warnings
            { name: "Cloudworkers", description: "⚠️ WARNING: Added per user request despite low ratings. Chat moderation platform with numerous reports of payment issues and account suspensions.", payRate: "€0.10 - €0.14 per message", requirements: "18+, Multiple languages", paymentMethods: ["PayPal", "Bank Transfer"], difficulty: "Beginner", timeCommitment: "Flexible hours", pros: ["Multiple language support", "Flexible schedule"], cons: ["2.6/5 Trustpilot rating", "Frequent payment complaints", "Sudden account terminations", "Questionable business practices"], tips: "⚠️ CAUTION: Read recent reviews carefully. Many users report non-payment and account blocking without explanation.", url: "https://cloudworkers.com", trustpilot: "https://www.trustpilot.com/review/cloudworkers.com", rating: "2.6/5", minCashout: "€20", warning: "This platform has a very low Trustpilot rating and numerous user complaints about payment issues and account suspensions." },
            { name: "e-Moderators", description: "⚠️ WARNING: Added per user request despite poor reviews. Adult chat moderation platform with mixed payment history and user complaints.", payRate: "$0.015 - $0.025 per message", requirements: "18+, English proficiency", paymentMethods: ["PayPal", "Wire Transfer"], difficulty: "Beginner", timeCommitment: "Flexible hours", pros: ["Immediate start possible", "No experience required"], cons: ["Mixed Trustpilot reviews", "Reports of account blocking", "Payment delays", "Unethical practices reported"], tips: "⚠️ CAUTION: Numerous 1-star reviews citing wage theft and account terminations. Consider other platforms first.", url: "https://e-moderators.com", trustpilot: "https://www.trustpilot.com/review/e-moderators.com", rating: "2.9/5", minCashout: "$50", warning: "This platform has poor reviews, with users reporting payment delays and account blocking." }
        ],
        'virtual-assistant': [
            { name: "Boldly", description: "Premium subscription staffing with W2 employee status and benefits.", payRate: "$22 - $25 per hour", requirements: "7+ years executive assistant experience, US-based", paymentMethods: ["Direct Deposit"], difficulty: "Expert", timeCommitment: "Full-time", pros: ["W2 employee status", "Benefits included", "Premium clients"], cons: ["Extremely selective", "Extensive experience required"], tips: "Demonstrate executive-level experience.", url: "https://boldly.com", trustpilot: "https://www.trustpilot.com/review/boldly.com", rating: "4.8/5", minCashout: "N/A" },
            { name: "Upwork", description: "Largest global freelance marketplace with massive volume of VA jobs.", payRate: "$10 - $50+ per hour", requirements: "Portfolio, proposals, Global availability", paymentMethods: ["Direct Deposit", "PayPal"], difficulty: "Intermediate", timeCommitment: "Variable", pros: ["Huge job volume", "Set own rates", "Global clients"], cons: ["High competition", "10% service fee"], tips: "Build strong profile, write compelling proposals.", url: "https://www.upwork.com", trustpilot: "https://www.trustpilot.com/review/upwork.com", rating: "4.6/5", minCashout: "$10" },
            { name: "Belay", description: "Premium virtual assistant services for entrepreneurs and executives.", payRate: "$13 - $18 per hour", requirements: "Administrative experience, US-based", paymentMethods: ["Direct Deposit"], difficulty: "Intermediate", timeCommitment: "20-40 hours per week", pros: ["Good pay rates", "Established company", "Professional clients"], cons: ["Selective hiring", "Minimum hour commitments"], tips: "Highlight specific skills, maintain professionalism.", url: "https://www.belaysolutions.com", trustpilot: "https://www.trustpilot.com/review/belaysolutions.com", rating: "4.3/5", minCashout: "N/A" },
            { name: "Time Etc", description: "Virtual assistant matching service for entrepreneurs and small businesses.", payRate: "$15 - $25 per hour", requirements: "Administrative experience, US or UK based", paymentMethods: ["Direct Deposit"], difficulty: "Intermediate", timeCommitment: "10-40 hours per week", pros: ["Flexible hours", "Variety of clients", "Growth opportunities"], cons: ["Geographic restrictions", "Experience preferred"], tips: "Emphasize independence and multitasking abilities.", url: "https://web.timeetc.com", trustpilot: "https://www.trustpilot.com/review/timeetc.com", rating: "4.5/5", minCashout: "$50" }
        ],
        'online-tutoring': [
            { name: "Outschool", description: "Unique marketplace for live online classes for kids with creative freedom.", payRate: "Set your own price per class", requirements: "Expertise in topic, background check, US/CA/AU/NZ/UK", paymentMethods: ["PayPal"], difficulty: "Intermediate", timeCommitment: "Variable", pros: ["High earning potential", "Creative freedom", "Any topic"], cons: ["30% service fee", "Need to create curriculum"], tips: "Choose unique topics, create engaging classes.", url: "https://outschool.com/teach", trustpilot: "https://www.trustpilot.com/review/outschool.com", rating: "4.6/5", minCashout: "$10" },
            { name: "Preply", description: "Language learning platform where tutors set their own rates.", payRate: "$5 - $30+ per hour", requirements: "Subject expertise, Global availability", paymentMethods: ["PayPal", "Wise", "Skrill"], difficulty: "Intermediate", timeCommitment: "5-40 hours per week", pros: ["Set your own rates", "Various subjects", "Flexible schedule"], cons: ["Need to attract students", "Commission fees"], tips: "Create attractive profile, offer competitive rates.", url: "https://preply.com", trustpilot: "https://www.trustpilot.com/review/preply.com", rating: "4.5/5", minCashout: "$10" },
            { name: "Cambly", warning: "This platform has an extremely poor user rating on Trustpilot. Users frequently report serious issues, including non-payment, unfair account suspensions, and unresponsive customer support. Proceed with extreme caution.", description: "Conversational English practice platform with flexible scheduling.", payRate: "$10.20 per hour", requirements: "Native English speaker, Global availability", paymentMethods: ["PayPal"], difficulty: "Beginner", timeCommitment: "5-40 hours per week", pros: ["No experience required", "Flexible schedule", "Simple conversation"], cons: ["Fixed low rate", "No curriculum provided"], tips: "Be patient and engaging, use props.", url: "https://www.cambly.com", trustpilot: "https://www.trustpilot.com/review/cambly.com", rating: "2.1/5", minCashout: "$20" },
            { name: "Chegg Tutors", warning: "This platform has an extremely poor user rating on Trustpilot. Users frequently report serious issues, including non-payment, unfair account suspensions, and unresponsive customer support. Proceed with extreme caution.", description: "On-demand tutoring platform for academic subjects with good starting pay.", payRate: "$20+ per hour", requirements: "University enrollment or degree, US-based", paymentMethods: ["Direct Deposit"], difficulty: "Intermediate", timeCommitment: "5-40 hours per week", pros: ["High starting pay", "Reputable platform", "Academic focus"], cons: ["Competitive for students", "Degree requirement"], tips: "Specialize in high-demand subjects, be available at peak hours.", url: "https://www.chegg.com/tutors", trustpilot: "https://www.trustpilot.com/review/chegg.com", rating: "2.3/5", minCashout: "$50" }
        ],
        'passive-income': [
            { name: "HoneyGain", description: "Leading bandwidth sharing platform for completely passive income.", payRate: "$15 - $50+ per month per device", requirements: "Internet connection, install app, Global", paymentMethods: ["PayPal", "Bitcoin"], difficulty: "Beginner", timeCommitment: "0 hours (passive)", pros: ["Completely passive", "Multiple devices", "Reliable payments"], cons: ["Slow earnings", "Uses bandwidth"], tips: "Use multiple devices, stable internet connection.", url: "https://www.honeygain.com", trustpilot: "https://www.trustpilot.com/review/honeygain.com", rating: "4.1/5", minCashout: "$20" },
            { name: "Pawns.app", description: "Multi-earning passive income platform with bandwidth sharing and surveys.", payRate: "$10 - $40+ per month", requirements: "Internet connection, install app, Global", paymentMethods: ["PayPal", "Bitcoin", "Gift Cards"], difficulty: "Beginner", timeCommitment: "0-2 hours per week", pros: ["Multiple earning methods", "Lower payout threshold", "Good rates"], cons: ["Newer platform", "Variable earnings"], tips: "Enable all earning methods, check for surveys.", url: "https://pawns.app", trustpilot: "https://www.trustpilot.com/review/pawns.app", rating: "4.2/5", minCashout: "$5" },
            { name: "SerpClix", description: "SEO click service requiring minimal active participation.", payRate: "$5 - $25 per month", requirements: "Chrome browser, follow clicking instructions, Global", paymentMethods: ["PayPal"], difficulty: "Beginner", timeCommitment: "10-30 minutes per day", pros: ["Simple clicks", "Daily earnings", "Low minimum payout"], cons: ["Limited earnings", "Requires daily activity"], tips: "Check multiple times daily, follow instructions precisely.", url: "https://serpclix.com", trustpilot: "https://www.trustpilot.com/review/serpclix.com", rating: "4.0/5", minCashout: "$5" }
        ]
    };

    const allPlatformsFlat = useMemo(() => Object.values(platforms).flat(), [platforms]);
    
    // AI Matchmaker Handler
    const handleAiMatch = async () => {
        if (!aiPrompt) {
            setAiError("Please tell me what you're looking for.");
            return;
        }

        setIsAiLoading(true);
        setAiResults([]);
        setAiError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const platformsForPrompt = allPlatformsFlat.map(p => ({
                name: p.name,
                description: p.description,
                payRate: p.payRate,
                requirements: p.requirements,
                paymentMethods: p.paymentMethods.join(', '),
                difficulty: p.difficulty,
                rating: p.rating,
                warning: p.warning || p.caution || null
            }));

            const systemInstruction = `You are an expert advisor for remote work and online earning opportunities. Your task is to analyze a user's request and a provided list of platforms to find the best matches.
            - You must return a JSON object that strictly adheres to the provided schema.
            - The JSON object must contain a key "recommendations".
            - The "recommendations" value must be an array of objects.
            - You must recommend between 2 and 4 platforms.
            - Each recommendation object MUST contain three keys: "platformName", "reason", and "matchScore".
            - "platformName" must be the exact name of a platform from the provided list.
            - "reason" must be a concise, personalized explanation (under 40 words) of why this platform is a great fit for the user's specific needs, referencing their query.
            - "matchScore" must be an integer between 1 and 10, representing how good of a match it is.
            - Prioritize platforms with higher ratings and those that closely match the user's stated requirements for location, payment methods, skills, and time commitment.
            - Strongly avoid platforms with a 'warning' field unless they are a perfect match for a very specific query.
            - Do not output anything other than the single, valid JSON object.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Here is the list of available platforms: ${JSON.stringify(platformsForPrompt)}. Now, please analyze the following user request and find the best matches: "${aiPrompt}"`,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            recommendations: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        platformName: { type: Type.STRING },
                                        reason: { type: Type.STRING },
                                        matchScore: { type: Type.INTEGER }
                                    },
                                    required: ["platformName", "reason", "matchScore"]
                                }
                            }
                        },
                        required: ["recommendations"]
                    },
                },
            });
            
            const jsonResponse = JSON.parse(response.text);
            if (jsonResponse.recommendations && jsonResponse.recommendations.length > 0) {
                 setAiResults(jsonResponse.recommendations);
            } else {
                setAiResults([]);
                setAiError("I couldn't find a perfect match. Try rephrasing your request!");
            }

        } catch (error) {
            console.error("AI Matchmaker Error:", error);
            setAiError("Sorry, something went wrong while fetching your matches. The AI assistant might be overloaded. Please try again in a moment.");
        } finally {
            setIsAiLoading(false);
        }
    };

    // HELPER FUNCTIONS
    const parseCashout = (cashoutString) => {
        if (typeof cashoutString !== 'string') return 0;
        const cleaned = cashoutString.replace(/[^0-9.]/g, '');
        const value = parseFloat(cleaned);
        return isNaN(value) ? 0 : value;
    };

    const parseRating = (ratingString) => {
        if (!ratingString) return 0;
        const match = ratingString.match(/^[0-9.]+/);
        return match ? parseFloat(match[0]) : 0;
    };

    const sortedPaymentProofSites = useMemo(() => {
        return [...paymentProofSites].sort((a, b) => parseRating(b.rating) - parseRating(a.rating));
    }, []);

    const sortedPlatforms = useMemo(() => {
        const newPlatforms: { [key: string]: Platform[] } = {};
        for (const categoryId in platforms) {
            newPlatforms[categoryId] = [...platforms[categoryId]].sort((a, b) => {
                return parseRating(b.rating) - parseRating(a.rating);
            });
        }
        return newPlatforms;
    }, []);

    // DERIVED STATE & EFFECTS
    const currentCategory = useMemo(() => categories.find(cat => cat.id === activeSection), [activeSection]);
    const currentPlatforms = useMemo(() => (currentCategory && sortedPlatforms[activeSection]) ? sortedPlatforms[activeSection] : [], [currentCategory, activeSection, sortedPlatforms]);
    
    const paymentMethodOptions = useMemo(() => {
        if (!currentPlatforms.length) return ['all'];
        const allMethods = new Set<string>();
        currentPlatforms.forEach(p => p.paymentMethods.forEach(method => allMethods.add(method)));
        return ['all', ...Array.from(allMethods).sort()];
    }, [currentPlatforms]);

    const maxCashoutValue = useMemo(() => {
        if (!currentPlatforms.length) return 100;
        const values = currentPlatforms.map(p => parseCashout(p.minCashout)).filter(n => !isNaN(n) && n > 0);
        return values.length > 0 ? Math.ceil(Math.max(...values)) : 100;
    }, [currentPlatforms]);
    
    useEffect(() => {
        if (currentCategory) {
            setFilters(prev => ({
                ...prev,
                maxCashout: maxCashoutValue,
            }));
        }
    }, [currentCategory, maxCashoutValue]);

    const filteredPlatforms = useMemo(() => {
        if (!currentPlatforms.length) return [];
        return currentPlatforms.filter(platform => {
            const paymentMatch = filters.paymentMethod === 'all' || platform.paymentMethods.includes(filters.paymentMethod);
            const regionMatch = filters.region === 'all' ||
                (filters.region === 'global' && platform.requirements.toLowerCase().includes('global')) ||
                (filters.region === 'us-ca' && (platform.requirements.toLowerCase().includes('us') || platform.requirements.toLowerCase().includes('ca')));
            const cashoutMatch = parseCashout(platform.minCashout) <= filters.maxCashout;
            const ratingMatch = parseRating(platform.rating) >= filters.minRating;
            return paymentMatch && regionMatch && cashoutMatch && ratingMatch;
        });
    }, [currentPlatforms, filters]);
    
    const filteredSites = useMemo(() => {
        return sortedPaymentProofSites.filter(site => {
            const matchesSearch = site.name.toLowerCase().includes(proofFilters.searchTerm.toLowerCase()) || site.description.toLowerCase().includes(proofFilters.searchTerm.toLowerCase());
            const matchesCategory = proofFilters.category === 'all' || site.category.toLowerCase().includes(proofFilters.category.toLowerCase()) || (proofFilters.category === 'passive' && site.category === 'Passive Income') || (proofFilters.category === 'survey' && site.category === 'Survey/GPT') || (proofFilters.category === 'research' && site.category === 'Research/Testing') || (proofFilters.category === 'chat' && site.category === 'Chat Moderation') || (proofFilters.category === 'data' && site.category === 'Data Annotation');
            const matchesRating = parseRating(site.rating) >= proofFilters.minRating;
            return matchesSearch && matchesCategory && matchesRating;
        });
    }, [proofFilters, sortedPaymentProofSites]);

    // EVENT HANDLERS
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: name === 'maxCashout' || name === 'minRating' ? parseFloat(value) : value
        }));
    };

    // SUB-COMPONENTS
    const PaymentProofCard = ({ site }) => (
        <div className="platform-card">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-white">{site.name}</h3>
                <div className="flex flex-col items-end">
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 mb-1">{site.category}</span>
                    {site.rating && <span className="text-xs text-yellow-400">⭐ {site.rating}</span>}
                </div>
            </div>
            <div className="card-content">
                <p className="text-gray-300 mb-3">{site.description}</p>
                <div className="mb-3">
                    <span className="text-sm text-gray-400">Minimum Cashout: </span>
                    <span className="text-green-400 font-semibold">{site.minCashout}</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
                <a href={site.paymentProof} target="_blank" rel="noopener noreferrer" className="glowing-btn text-sm" style={{ '--glow-color': 'hsl(140, 100%, 70%)' } as React.CSSProperties}>
                    <i className="fas fa-receipt mr-2"></i>Payment Proof
                </a>
                {site.trustpilot && (
                    <a href={site.trustpilot} target="_blank" rel="noopener noreferrer" className="glowing-btn text-sm" style={{ '--glow-color': 'hsl(50, 100%, 70%)' } as React.CSSProperties}>
                        <i className="fas fa-star mr-2"></i>Trustpilot
                    </a>
                )}
            </div>
        </div>
    );

    const CategoryCard = ({ category }) => {
        const categoryPlatforms = platforms[category.id] || [];
        return (
            <div className="platform-card">
                <div className="flex items-center mb-4">
                    <i className={`${category.icon} text-2xl mr-3`} style={{ color: category.color }}></i>
                    <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                </div>
                <div className="card-content">
                    <p className="text-gray-300 mb-4">{categoryPlatforms.length} verified platforms available</p>
                </div>
                <button onClick={() => setActiveSection(category.id)} className="glowing-btn mt-4" style={{ '--glow-color': category.color } as React.CSSProperties}>
                    Explore Opportunities
                </button>
            </div>
        );
    };

    const PlatformCard = ({ platform }: { platform: Platform }) => (
        <div className="platform-card">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                <div className="flex flex-col items-end">
                    <span className={`text-xs px-2 py-1 rounded mb-1 ${platform.difficulty === 'Beginner' ? 'bg-green-600 text-green-100' : platform.difficulty === 'Intermediate' ? 'bg-yellow-600 text-yellow-100' : platform.difficulty === 'Advanced' ? 'bg-red-600 text-red-100' : platform.difficulty === 'Expert' ? 'bg-purple-600 text-purple-100' : 'bg-gray-600 text-gray-100'}`}>
                        {platform.difficulty}
                    </span>
                    {platform.rating && <span className="text-xs text-yellow-400">⭐ {platform.rating}</span>}
                </div>
            </div>
            <div className="card-content">
                {platform.warning && (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-3 text-sm text-red-200">
                        <strong className="font-bold block mb-1">🚩 HIGH-RISK WARNING</strong>
                        <p>{platform.warning}</p>
                    </div>
                )}
                {platform.caution && (
                    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 mb-3 text-sm text-yellow-200">
                        <strong className="font-bold block mb-1">⚠️ CAUTION</strong>
                        <p>{platform.caution}</p>
                    </div>
                )}
                <p className="text-gray-300 mb-3">{platform.description}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                    <div>
                        <span className="text-sm text-gray-400">Pay Rate:</span>
                        <p className="text-green-400 font-semibold">{platform.payRate}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-400">Time:</span>
                        <p className="text-blue-400 font-semibold">{platform.timeCommitment}</p>
                    </div>
                    {platform.minCashout && (
                        <div className="col-span-2">
                            <span className="text-sm text-gray-400">Minimum Cashout: </span>
                            <span className="text-green-400 font-semibold">{platform.minCashout}</span>
                        </div>
                    )}
                </div>
                <div className="mb-4">
                    <span className="text-sm text-gray-400">Payment Methods:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {platform.paymentMethods.map((method, idx) => (
                            <span key={idx} className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{method}</span>
                        ))}
                    </div>
                </div>
                <div className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-green-400 font-semibold mb-2">Pros:</h4>
                            <ul className="text-sm text-gray-300">
                                {platform.pros.map((pro, idx) => (
                                    <li key={idx} className="flex items-start mb-1">
                                        <i className="fas fa-check text-green-400 mr-2 mt-1 text-xs"></i>{pro}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-red-400 font-semibold mb-2">Cons:</h4>
                            <ul className="text-sm text-gray-300">
                                {platform.cons.map((con, idx) => (
                                    <li key={idx} className="flex items-start mb-1">
                                        <i className="fas fa-times text-red-400 mr-2 mt-1 text-xs"></i>{con}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mb-4 p-3 bg-gray-800 rounded">
                    <h4 className="text-yellow-400 font-semibold mb-2">
                        <i className="fas fa-lightbulb mr-2"></i>Pro Tips:
                    </h4>
                    <p className="text-sm text-gray-300">{platform.tips}</p>
                </div>
            </div>
            <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-gray-700/50">
                <div className="text-xs text-gray-400">
                    <strong>Requirements:</strong> {platform.requirements}
                </div>
                <div className="flex flex-wrap gap-2">
                    <a href={platform.url} target="_blank" rel="noopener noreferrer" className="glowing-btn text-sm" style={{ '--glow-color': 'var(--glow-color-blue)' } as React.CSSProperties}>
                        <i className="fas fa-external-link-alt mr-2"></i>Apply Now
                    </a>
                    {platform.trustpilot && (
                        <a href={platform.trustpilot} target="_blank" rel="noopener noreferrer" className="glowing-btn text-sm" style={{ '--glow-color': 'hsl(50, 100%, 70%)' } as React.CSSProperties}>
                            <i className="fas fa-star mr-2"></i>Reviews
                        </a>
                    )}
                </div>
            </div>
        </div>
    );

    // MAIN RENDER LOGIC
    const renderContent = () => {
        if (activeSection === 'home') {
            return (
                <div>
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                            Remote Work Hub 2025
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8">
                            Your ultimate destination for thoroughly vetted remote work opportunities with verified payment proofs and comprehensive quality research
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <button onClick={() => setActiveSection('payment-proofs')} className="glowing-btn text-lg px-8 py-4" style={{ '--glow-color': 'hsl(140, 100%, 70%)' } as React.CSSProperties}>
                                <i className="fas fa-receipt mr-2"></i>View Payment Proofs
                            </button>
                            <button onClick={() => setActiveSection('categories')} className="glowing-btn text-lg px-8 py-4" style={{ '--glow-color': 'hsl(220, 100%, 70%)' } as React.CSSProperties}>
                                <i className="fas fa-search mr-2"></i>Browse Categories
                            </button>
                        </div>
                    </div>
                    
                    {/* AI Matchmaker Section */}
                    <div className="my-16 p-6 md:p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/10">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                <i className="fas fa-magic mr-3"></i>AI Opportunity Matchmaker
                            </h2>
                            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                                Don't know where to start? Describe what you're looking for, and our AI assistant will find the perfect platforms for you.
                            </p>
                        </div>

                        <div className="max-w-3xl mx-auto">
                            <textarea
                                className="search-input w-full h-28 p-4 text-base resize-none"
                                placeholder="e.g., I'm a student in Europe with 10 hours a week, looking for something that pays via PayPal. I'm good at writing..."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                disabled={isAiLoading}
                            />
                            <div className="text-center mt-6">
                                <button 
                                    onClick={handleAiMatch} 
                                    disabled={isAiLoading} 
                                    className="glowing-btn text-lg px-8 py-4"
                                    style={{'--glow-color': 'var(--glow-color-purple)'} as React.CSSProperties}
                                >
                                    {isAiLoading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-3"></i>Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-search-dollar mr-3"></i>Find My Matches
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {aiError && (
                            <div className="mt-8 max-w-3xl mx-auto bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-center text-red-200">
                                {aiError}
                            </div>
                        )}

                        {aiResults.length > 0 && (
                            <div className="mt-12">
                                <h3 className="text-2xl font-bold text-center mb-8 text-green-400">Here are your top matches!</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {aiResults.map(result => {
                                        const platform = allPlatformsFlat.find(p => p.name === result.platformName);
                                        if (!platform) return null;
                                        
                                        return (
                                            <div key={platform.name} className="platform-card flex flex-col border-purple-400/50" style={{'--glow-color': 'var(--glow-color-purple)'} as React.CSSProperties}>
                                                <div className="p-4 bg-purple-900/20 rounded-t-lg border-b border-purple-500/30">
                                                    <h4 className="text-lg font-bold text-purple-300 mb-2">
                                                        <i className="fas fa-robot mr-2"></i>AI Recommendation
                                                    </h4>
                                                    <p className="text-sm text-gray-300 italic">"{result.reason}"</p>
                                                    <div className="text-right text-purple-300 font-bold mt-2 text-sm">Match Score: {result.matchScore}/10</div>
                                                </div>
                                                <div className="p-4 flex flex-col flex-grow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                                                        {platform.rating && <span className="text-xs text-yellow-400">⭐ {platform.rating}</span>}
                                                    </div>
                                                    <div className="card-content flex-grow">
                                                        <p className="text-gray-300 mb-3 text-sm">{platform.description}</p>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                                                            <div>
                                                                <span className="text-xs text-gray-400">Pay Rate:</span>
                                                                <p className="text-green-400 font-semibold text-sm">{platform.payRate}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-gray-400">Difficulty:</span>
                                                                <p className="text-blue-400 font-semibold text-sm">{platform.difficulty}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-700/50">
                                                        <a href={platform.url} target="_blank" rel="noopener noreferrer" className="glowing-btn text-sm" style={{ '--glow-color': 'var(--glow-color-blue)' } as React.CSSProperties}>
                                                            <i className="fas fa-external-link-alt mr-2"></i>Details
                                                        </a>
                                                        {platform.trustpilot && (
                                                            <a href={platform.trustpilot} target="_blank" rel="noopener noreferrer" className="glowing-btn text-sm" style={{ '--glow-color': 'hsl(50, 100%, 70%)' } as React.CSSProperties}>
                                                                <i className="fas fa-star mr-2"></i>Reviews
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>


                    <div className="contact-info">
                        <h2 className="text-2xl font-bold mb-4 text-white">Support This Project</h2>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                            <div className="text-center">
                                <p className="text-gray-300 mb-4">Help keep this resource free and updated:</p>
                                <a href='https://ko-fi.com/I2I71AM3Z9' target='_blank' rel="noopener noreferrer">
                                    <img height='36' style={{border:'0px',height:'36px'}} src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' alt='Buy Me a Coffee at ko-fi.com' />
                                </a>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-300 mb-2">Questions or suggestions?</p>
                                <a href="https://t.me/Sammarkey4" target="_blank" rel="noopener noreferrer" className="telegram-link">
                                    <i className="fab fa-telegram text-lg"></i>
                                    <span>@Sammarkey4</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="text-center p-6 border border-gray-700 rounded-lg">
                            <i className="fas fa-shield-alt text-4xl text-green-400 mb-4"></i>
                            <h3 className="text-xl font-bold mb-2">Thoroughly Researched Platforms</h3>
                            <p className="text-gray-300">All platforms verified through Trustpilot, Reddit, and community reviews. Low-rated platforms removed.</p>
                        </div>
                        <div className="text-center p-6 border border-gray-700 rounded-lg">
                            <i className="fas fa-chart-line text-4xl text-blue-400 mb-4"></i>
                            <h3 className="text-xl font-bold mb-2">$1 - $500+ Per Task</h3>
                            <p className="text-gray-300">Wide range of earning opportunities from micro-tasks to high-paying studies</p>
                        </div>
                        <div className="text-center p-6 border border-gray-700 rounded-lg">
                            <i className="fas fa-clock text-4xl text-purple-400 mb-4"></i>
                            <h3 className="text-xl font-bold mb-2">Verified Payment Records</h3>
                            <p className="text-gray-300">Only platforms with proven payment history and positive user feedback</p>
                        </div>
                    </div>
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-center mb-8">Top Earning Categories</h2>
                        <div className="category-grid">
                            {categories.slice(0, 6).map(category => (
                                <CategoryCard key={category.id} category={category} />
                            ))}
                        </div>
                    </div>
                    <div className="text-center mb-16 p-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30">
                        <h2 className="text-3xl font-bold mb-4">Quality Research Standards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="text-left">
                                <h4 className="text-xl font-semibold mb-3 text-green-400">✓ Multi-Source Verification</h4>
                                <p className="text-gray-300">Every platform checked across Trustpilot, Reddit, Glassdoor, and community forums for authentic user experiences.</p>
                            </div>
                            <div className="text-left">
                                <h4 className="text-xl font-semibold mb-3 text-blue-400">✓ Continuous Monitoring</h4>
                                <p className="text-gray-300">Regular review updates and platform monitoring to ensure continued quality and reliability.</p>
                            </div>
                            <div className="text-left">
                                <h4 className="text-xl font-semibold mb-3 text-purple-400">✓ Rating Requirements</h4>
                                <p className="text-gray-300">Minimum 3.5-star requirement across review platforms, with immediate removal for declining ratings.</p>
                            </div>
                            <div className="text-left">
                                <h4 className="text-xl font-semibold mb-3 text-yellow-400">✓ Payment Verification</h4>
                                <p className="text-gray-300">All platforms backed by verified payment proofs from real Reddit community members.</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeSection === 'payment-proofs') {
            return (
                <div>
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-green-400">
                            <i className="fas fa-receipt mr-4"></i>Payment Proofs Gallery
                        </h1>
                        <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8">
                            Real payment screenshots from verified Reddit users showing actual earnings from these platforms. Every site listed has been thoroughly researched and verified across multiple review platforms.
                        </p>
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 max-w-3xl mx-auto mb-8">
                            <p className="text-yellow-200 text-sm">
                                <i className="fas fa-info-circle mr-2"></i>
                                <strong>Disclaimer:</strong> Payment proofs are from various Reddit users and community members. Earnings may vary based on location, time invested, and individual circumstances.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700 items-start">
                        <div className="lg:col-span-1">
                            <label htmlFor="proofSearch" className="block text-sm font-medium text-gray-300 mb-1">Search by Name</label>
                            <input id="proofSearch" type="text" placeholder="e.g. FreeCash" className="search-input" value={proofFilters.searchTerm} onChange={(e) => setProofFilters(p => ({...p, searchTerm: e.target.value}))} />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Category</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {['all', 'survey', 'research', 'passive', 'micro-tasks', 'chat', 'data'].map(filter => (
                                    <button key={filter} className={`px-3 py-1 text-sm rounded transition-colors ${proofFilters.category === filter ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`} onClick={() => setProofFilters(p => ({...p, category: filter}))}>
                                        {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            <label htmlFor="proofRating" className="block text-sm font-medium text-gray-300 mb-1">Min. Rating: <span className="font-bold text-yellow-400">{proofFilters.minRating.toFixed(1)} ★</span></label>
                            <input id="proofRating" type="range" name="minRating" min="3.5" max="5" step="0.1" value={proofFilters.minRating} onChange={(e) => setProofFilters(p => ({...p, minRating: parseFloat(e.target.value)}))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                    </div>
                    <div className="mb-8 text-center">
                        <p className="text-gray-400">Found <span className="text-white font-semibold">{filteredSites.length}</span> verified high-quality platforms</p>
                    </div>
                    <div className="category-grid">
                        {filteredSites.map((site, index) => (
                            <PaymentProofCard key={index} site={site} />
                        ))}
                    </div>
                </div>
            );
        }

        if (activeSection === 'categories') {
            return (
                <div>
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-blue-400">
                            <i className="fas fa-th-large mr-4"></i>All Categories
                        </h1>
                        <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8">
                            Explore thoroughly researched remote work opportunities organized by earning method and skill requirements. All platforms maintain high quality standards and verified user satisfaction.
                        </p>
                    </div>
                    <div className="category-grid">
                        {categories.map(category => (
                            <CategoryCard key={category.id} category={category} />
                        ))}
                    </div>
                </div>
            );
        }

        if (activeSection === 'privacy-policy') {
            return (
                <div className="max-w-4xl mx-auto text-gray-300 prose prose-invert prose-lg">
                    <button onClick={() => setActiveSection('home')} className="glowing-btn mb-8" style={{'--glow-color': 'var(--glow-color-blue)'} as React.CSSProperties}>
                        <i className="fas fa-arrow-left mr-2"></i>Back to Home
                    </button>
                    <h1 className="text-4xl font-bold mb-6 text-blue-400">Privacy Policy</h1>
                    <p className="text-gray-400">Last Updated: October 2025</p>
                    <p>Welcome to Remote Work Hub 2025 ("we", "us", "our"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>
                    
                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Information We Collect</h2>
                    <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
                    <ul>
                        <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Site.</li>
                        <li><strong>Third-Party Data:</strong> We use third-party services like Ko-fi for support and Telegram for communication. Any information you provide to these services is subject to their respective privacy policies.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Use of Your Information</h2>
                    <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
                    <ul>
                        <li>Analyze usage and trends to improve our website and your experience.</li>
                        <li>Monitor and analyze usage and trends to improve the quality of our recommendations.</li>
                        <li>Maintain the security and operation of our website.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Affiliate Links and Cookies</h2>
                    <p>This website uses affiliate links. If you click on an affiliate link and make a purchase or sign up, we may receive a commission at no extra cost to you. These links may use cookies to track your activity for commission purposes. By using this site, you consent to the use of these cookies.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Third-Party Websites</h2>
                    <p>The Site contains links to third-party websites and applications of interest, including advertisements and external services, that are not affiliated with us. Once you have used these links to leave the Site, any information you provide to these third parties is not covered by this Privacy Policy, and we cannot guarantee the safety and privacy of your information.</p>
                     
                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Security of Your Information</h2>
                    <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Contact Us</h2>
                    <p>If you have questions or comments about this Privacy Policy, please contact us via Telegram at @Sammarkey4.</p>
                </div>
            );
        }

        if (activeSection === 'terms-of-service') {
            return (
                <div className="max-w-4xl mx-auto text-gray-300 prose prose-invert prose-lg">
                    <button onClick={() => setActiveSection('home')} className="glowing-btn mb-8" style={{'--glow-color': 'var(--glow-color-blue)'} as React.CSSProperties}>
                        <i className="fas fa-arrow-left mr-2"></i>Back to Home
                    </button>
                    <h1 className="text-4xl font-bold mb-6 text-blue-400">Terms of Service</h1>
                    <p className="text-gray-400">Last Updated: October 2025</p>
                    <p>By accessing and using Remote Work Hub 2025 (the "Site"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the below, please do not use this service.</p>
                    
                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Disclaimers and Limitation of Liability</h2>
                    <p>The information on this Site is provided for general information purposes only. You must read and agree to the following disclaimers:</p>

                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 my-4">
                        <h3 className="text-xl font-bold text-yellow-300 mb-2">Affiliate Disclosure</h3>
                        <p className="text-yellow-200">This Site contains affiliate links. This means that if you click on a link and sign up for a service or make a purchase, we may receive a commission at no additional cost to you. We only recommend platforms we believe are of high quality, but our recommendations are influenced by these affiliate relationships.</p>
                    </div>

                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 my-4">
                        <h3 className="text-xl font-bold text-red-300 mb-2">Earnings Disclaimer</h3>
                        <p className="text-red-200">This Site makes no guarantees about your ability to get earnings with the platforms, ideas, information, tools, or strategies mentioned. All earning potentials, pay rates, and payment proofs are examples and estimates. Your results may vary and will be based on your individual capacity, experience, and level of desire. There are no guarantees concerning the level of success you may experience.</p>
                    </div>

                    <ul>
                        <li><strong>Accuracy of Information:</strong> While we strive to provide accurate and up-to-date information, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or availability of any information, products, or services on the Site. Any reliance you place on such information is strictly at your own risk.</li>
                        <li><strong>Third-Party Links:</strong> We are not responsible for the content, policies, or practices of any third-party websites linked to on this Site. We encourage you to review the terms and privacy policies of any third-party sites you visit.</li>
                        <li><strong>No Professional Advice:</strong> The content on this site is not a substitute for professional financial, legal, or tax advice. Always seek the advice of a qualified professional with any questions you may have.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Intellectual Property</h2>
                    <p>The Site and its original content, features, and functionality are owned by the Site operator and are protected by international copyright, trademark, and other intellectual property or proprietary rights laws.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Changes to Terms</h2>
                    <p>We reserve the right to modify these terms at any time. We do so by posting and drawing attention to the updated terms on the Site. Your decision to continue to visit and make use of the Site after such changes have been made constitutes your formal acceptance of the new Terms of Service.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-purple-400">Contact Us</h2>
                    <p>If you have any questions about this Agreement, please feel free to contact us via Telegram at @Sammarkey4.</p>
                </div>
            );
        }

        if (currentCategory) {
            return (
                <div>
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{ color: currentCategory.color }}>
                            <i className={`${currentCategory.icon} mr-4`}></i>{currentCategory.name}
                        </h1>
                        <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8">
                            Thoroughly vetted platforms for {currentCategory.name.toLowerCase()}. All maintain high quality ratings and have verified payment records from real users.
                        </p>
                        {activeSection === 'chat-moderation' && (
                             <div className="warning-box max-w-4xl mx-auto">
                                <h3 className="text-lg font-bold text-red-400 mb-2"><i className="fas fa-exclamation-triangle mr-2"></i>Important Warning</h3>
                                <p className="text-red-300">
                                    This category involves moderating adult content. Many platforms in this space have questionable business practices, inconsistent payments, and may terminate accounts without notice. 
                                    We've listed only the most reputable options available based on community verification, but <strong className="font-bold">extreme caution is advised</strong>. 
                                    Always research recent reviews before investing time.
                                </p>
                            </div>
                        )}
                        <button onClick={() => setActiveSection('categories')} className="glowing-btn mb-8" style={{ '--glow-color': currentCategory.color } as React.CSSProperties}>
                            <i className="fas fa-arrow-left mr-2"></i>Back to Categories
                        </button>
                    </div>
                    
                    <div className="bg-gray-800/50 p-4 rounded-lg mb-8 border border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="w-full">
                                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-300 mb-1">Payment Method</label>
                                <select id="paymentMethod" name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange} className="filter-select">
                                    {paymentMethodOptions.map(method => <option key={method} value={method}>{method === 'all' ? 'All Methods' : method}</option>)}
                                </select>
                            </div>
                            <div className="w-full">
                                <label htmlFor="region" className="block text-sm font-medium text-gray-300 mb-1">Region</label>
                                <select id="region" name="region" value={filters.region} onChange={handleFilterChange} className="filter-select">
                                    <option value="all">All Regions</option>
                                    <option value="global">Global</option>
                                    <option value="us-ca">US/Canada Focus</option>
                                </select>
                            </div>
                            <div className="w-full">
                                <label htmlFor="maxCashout" className="block text-sm font-medium text-gray-300 mb-1">Max. Min Cashout: <span className="font-bold text-green-400">${filters.maxCashout}</span></label>
                                <input type="range" id="maxCashout" name="maxCashout" min="0" max={maxCashoutValue} step="1" value={filters.maxCashout} onChange={handleFilterChange} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                            </div>
                            <div className="w-full">
                                <label htmlFor="minRating" className="block text-sm font-medium text-gray-300 mb-1">Min. Rating: <span className="font-bold text-yellow-400">{filters.minRating.toFixed(1)} ★</span></label>
                                <input type="range" id="minRating" name="minRating" min="2.5" max="5" step="0.1" value={filters.minRating} onChange={handleFilterChange} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8 text-center">
                        <p className="text-gray-400">Showing <span className="text-white font-semibold">{filteredPlatforms.length}</span> of {currentPlatforms.length} verified platforms</p>
                    </div>
                    <div className="category-grid">
                        {filteredPlatforms.map((platform, index) => (
                            <PlatformCard key={index} platform={platform} />
                        ))}
                    </div>
                </div>
            );
        }

        return <div>Page not found</div>;
    };

    // COMPONENT RETURN
    return (
        <div className="min-h-screen">
            <nav className="sticky top-0 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm border-b border-gray-700" style={{ position: 'relative' }}>
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between">
                        <div className="text-2xl font-bold cursor-pointer" onClick={() => setActiveSection('home')}>
                            <i className="fas fa-laptop-house text-blue-400 mr-2"></i>RemoteHub2025
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <span className={`nav-item ${activeSection === 'home' ? 'active' : ''}`} onClick={() => setActiveSection('home')}>
                                <i className="fas fa-home mr-2"></i>Home
                            </span>
                            <span className={`nav-item ${activeSection === 'payment-proofs' ? 'active' : ''}`} onClick={() => setActiveSection('payment-proofs')}>
                                <i className="fas fa-receipt mr-2"></i>Payment Proofs
                            </span>
                            <span className={`nav-item ${activeSection === 'categories' || categories.some(c => c.id === activeSection) ? 'active' : ''}`} onClick={() => setActiveSection('categories')}>
                                <i className="fas fa-th-large mr-2"></i>Categories
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-12">
                {renderContent()}
            </main>

            <footer className="bg-gray-900 border-t border-gray-700 py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold mb-4">Start Your Remote Earning Journey</h3>
                        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
                            All platforms have been thoroughly researched and verified across multiple review sources. Only high-quality, trusted platforms with verified payment records are included.
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
                            <button onClick={() => setActiveSection('gpt-microtask')} className="glowing-btn" style={{ '--glow-color': 'hsl(50, 100%, 70%)' } as React.CSSProperties}>
                                Start with GPT Sites
                            </button>
                            <button onClick={() => setActiveSection('passive-income')} className="glowing-btn" style={{ '--glow-color': 'hsl(45, 100%, 70%)' } as React.CSSProperties}>
                                Try Passive Income
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="text-center">
                            <h4 className="text-lg font-semibold mb-3 text-green-400">Research Standards</h4>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>✓ Trustpilot rating verification</li>
                                <li>✓ Reddit community feedback</li>
                                <li>✓ Payment proof validation</li>
                                <li>✓ Continuous monitoring</li>
                            </ul>
                        </div>
                        <div className="text-center">
                            <h4 className="text-lg font-semibold mb-3 text-blue-400">Safety Tips</h4>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>Never pay to join platforms</li>
                                <li>Check latest reviews regularly</li>
                                <li>Start with small time commitments</li>
                                <li>Keep records of earnings</li>
                            </ul>
                        </div>
                        <div className="text-center">
                            <h4 className="text-lg font-semibold mb-3 text-purple-400">Maximizing Earnings</h4>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>Use multiple verified platforms</li>
                                <li>Focus on higher-paying tasks</li>
                                <li>Build good ratings/reviews</li>
                                <li>Specialize in profitable niches</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-8 text-center">
                        <div className="flex justify-center gap-6 mb-4">
                            <span onClick={() => setActiveSection('terms-of-service')} className="text-gray-400 hover:text-white cursor-pointer transition-colors text-sm">Terms of Service</span>
                            <span onClick={() => setActiveSection('privacy-policy')} className="text-gray-400 hover:text-white cursor-pointer transition-colors text-sm">Privacy Policy</span>
                        </div>
                        <p className="text-gray-400 mb-2">
                            © 2025 Remote Work Hub. All platforms thoroughly researched and verified across multiple review sources.
                        </p>
                        <p className="text-sm text-gray-500">
                            This site includes affiliate links and is for informational purposes only. It is not financial or legal advice. 
                            Earnings may vary based on location, time invested, and individual circumstances.
                        </p>
                        <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Support:</span>
                                <a href='https://ko-fi.com/I2I71AM3Z9' target='_blank' rel="noopener noreferrer">
                                    <img height='24' style={{border:'0px',height:'24px'}} src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' alt='Buy Me a Coffee at ko-fi.com' />
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Contact:</span>
                                <a href="https://t.me/Sammarkey4" target="_blank" rel="noopener noreferrer" className="telegram-link">
                                    <i className="fab fa-telegram"></i>
                                    <span>@Sammarkey4</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
