const hackathons = [
    {
        id: "sih-2025",
        name: "Smart India Hackathon (SIH)",
        platform: "Government of India",
        deadline: "15 March 2025",
        img: "assets/sih-logo.png", // Placeholder
        description: "World's biggest open innovation model, Smart India Hackathon 2025 is a nationwide initiative to provide students a platform to solve some of the pressing problems we face in our daily lives, and thus inculcate a culture of product innovation and a mindset of problem-solving.",
        rules: [
            "Team size: 6 members (at least 1 female member mandatory).",
            "Projects must be original.",
            "Ideas must address the specific problem statements."
        ],
        prizes: "₹1,00,000 for winning teams per problem statement.",
        link: "https://www.sih.gov.in"
    },
    {
        id: "devfolio-web3",
        name: "Devfolio – Web3 Hackathon",
        platform: "Devfolio",
        deadline: "28 February 2025",
        img: null,
        description: "Build the future of the internet. This hackathon focuses on decentralized applications, blockchain tools, and the next generation of web technologies.",
        rules: [
            "Open to all developers.",
            "Must use at least one sponsor technology.",
            "Code must be open source."
        ],
        prizes: "$50,000 prize pool + Grants.",
        link: "https://devfolio.co"
    },
    {
        id: "google-solution",
        name: "Google Solution Challenge",
        platform: "Google Developers",
        deadline: "1 April 2025",
        img: null,
        description: "The Google Solution Challenge 2025 mission is to solve for one of the United Nations' 17 Sustainable Development Goals using Google technology.",
        rules: [
            "Must be a GDSC member.",
            "Team size: 1-4 members.",
            "Must use Google Cloud or Firebase."
        ],
        prizes: "Mentorship from Google, specialized swag, and feature on Google channels.",
        link: "https://developers.google.com/community/gdsc-solution-challenge"
    },
    {
        id: "unicef-youth",
        name: "UNICEF Youth Innovation Challenge",
        platform: "UNICEF",
        deadline: "10 May 2025",
        img: null,
        description: "Empowering young people to design solutions for the unique challenges faced by children and youth around the globe.",
        rules: [
            "Age limit: 14-24 years.",
            "Focus on social impact.",
            "Prototype required."
        ],
        prizes: "Seed funding and incubation support.",
        link: "https://www.unicef.org/innovation/venturefund"
    }
];

// If running in node environment (for testing), export module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hackathons;
} else {
    // Browser environment
    window.hackathonData = hackathons;
}
