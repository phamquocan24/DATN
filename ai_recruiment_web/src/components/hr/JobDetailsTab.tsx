import React from 'react';
import { FiEdit, FiCheckCircle, FiHeart, FiUmbrella, FiTrendingUp, FiUsers, FiHome, FiTruck, FiGift, FiBriefcase, FiArrowLeft } from 'react-icons/fi';

const JobDetailsTab: React.FC = () => {
    
    const perks = [
        { icon: <FiHeart />, title: "Full Healthcare" },
        { icon: <FiUmbrella />, title: "Unlimited Vacation" },
        { icon: <FiTrendingUp />, title: "Skill Development" },
        { icon: <FiUsers />, title: "Team Summits" },
        { icon: <FiHome />, title: "Remote Working" },
        { icon: <FiTruck />, title: "Commuter Benefits" },
        { icon: <FiGift />, title: "We give back" },
    ];

    return (
        <div className="bg-white text-gray-800 text-left">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Social Media Assistant</h2>
                        <p className="text-sm text-gray-500">Design • Full-Time • 4 / 11 Hired</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50">
                    <span className="text-lg">+</span> More Action
                </button>
            </div>

            {/* Job Header Card (Full Width) */}
            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500 text-white flex items-center justify-center rounded-lg text-2xl font-bold">
                        S
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">Social Media Assistant</h3>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50">
                    <FiEdit /> Edit Job Details
                </button>
            </div>

            {/* Main Content Grid (Top part) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left/Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Section title="Description">
                        <p className="text-gray-600">Stripe is looking for Social Media Marketing expert to help manage our online networks. You will be responsible for monitoring our social media channels, creating content, finding effective ways to engage the community and incentivize others to engage on our channels.</p>
                    </Section>

                    <Section title="Responsibilities">
                        <ul className="space-y-2 list-inside">
                            <ListItem>Community engagement to ensure that is supported and actively represented online</ListItem>
                            <ListItem>Focus on social media content development and publication</ListItem>
                            <ListItem>Marketing and strategy support</ListItem>
                            <ListItem>Stay on top of trends on social media platforms, and suggest content ideas to the team</ListItem>
                            <ListItem>Engage with online communities</ListItem>
                        </ul>
                    </Section>

                    <Section title="Who You Are">
                        <ul className="space-y-2 list-inside">
                            <ListItem>You get energy from people and building the ideal work environment</ListItem>
                            <ListItem>You have a sense for beautiful spaces and office experiences</ListItem>
                            <ListItem>You are a confident office manager, ready for added responsibilities</ListItem>
                            <ListItem>You're detail-oriented and creative</ListItem>
                            <ListItem>You're a growth marketer and know how to run campaigns</ListItem>
                        </ul>
                    </Section>
                    
                    <Section title="Nice-To-Haves">
                         <ul className="space-y-2 list-inside">
                            <ListItem>Fluent in English</ListItem>
                            <ListItem>Project management skills</ListItem>
                            <ListItem>Copy editing skills</ListItem>
                        </ul>
                    </Section>
                </div>

                {/* Right Column / Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="About this role">
                        <div className="text-sm">
                            <p>5 applied <span className="text-gray-500">of 10 capacity</span></p>
                            <div className="w-full h-2 bg-gray-200 rounded-full my-2">
                                <div className="w-1/2 h-full bg-green-500 rounded-full"></div>
                            </div>
                        </div>
                        <InfoRow label="Apply Before" value="July 31, 2021" />
                        <InfoRow label="Job Posted On" value="July 1, 2021" />
                        <InfoRow label="Job Type" value="Full-Time" />
                        <InfoRow label="Salary" value="$75k-$85k USD" />
                    </InfoCard>
                    
                    <InfoCard title="Categories">
                        <div className="flex flex-wrap gap-2">
                            <Pill text="Marketing" color="yellow" />
                            <Pill text="Design" color="green" />
                        </div>
                    </InfoCard>

                    <InfoCard title="Required Skills">
                        <div className="flex flex-wrap gap-2">
                            {['Project Management', 'Copywriting', 'English', 'Social Media Marketing', 'Copy Editing'].map(skill => (
                                <span key={skill} className="px-3 py-1 bg-gray-100 text-[#007BFF] rounded-md text-sm font-medium">{skill}</span>
                            ))}
                        </div>
                    </InfoCard>
                </div>
            </div>

            {/* Divider and Perks section (Full Width) */}
            <div className="border-t border-gray-200 mt-8 pt-8">
                <Section title="Perks & Benefits">
                    <p className="text-gray-600 mb-6">This job comes with several perks and benefits</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {perks.map(perk => (
                            <div key={perk.title} className="flex items-start text-left gap-4">
                                <div className="text-blue-500 text-3xl">{perk.icon}</div>
                                <div>
                                    <h4 className="font-semibold mb-1">{perk.title}</h4>
                                    <p className="text-sm text-gray-600">We believe in thriving communities and that starts with our team being happy and healthy.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            </div>
        </div>
    );
};

// Helper components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {children}
    </div>
);

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start gap-2">
        <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
        <span>{children}</span>
    </li>
);

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 border rounded-lg space-y-4">
        <h4 className="font-semibold">{title}</h4>
        {children}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium">{value}</span>
    </div>
);

const Pill: React.FC<{ text: string; color: 'yellow' | 'green' }> = ({ text, color }) => {
    const colors = {
        yellow: 'bg-yellow-100 text-yellow-700',
        green: 'bg-green-100 text-green-700'
    };
    return <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[color]}`}>{text}</span>;
}

export default JobDetailsTab; 