// queryllm.js
import dotenv from "dotenv";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createSqlAgent } from "langchain/agents/sql";
import { SQLDatabase } from "langchain/sql_db";
import { createRetrieverTool } from "langchain/agents/toolkits";
import { FAISS } from "langchain/vectorstores/faiss";
import { SemanticSimilarityExampleSelector } from "langchain/example_selectors";
import { ChatPromptTemplate, FewShotPromptTemplate, PromptTemplate, SystemMessagePromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";


dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// database
const sqlDB = await SQLDatabase.fromUri("sqlite:///database.sqlite");

//  LLM
const llm = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  model: "gpt-3.5-turbo",
  temperature: 0,
});

// retriever 
const tableInfo = sqlDB.context.table_info;

async function queryAsList(query) {
  const res = await sqlDB.run(query);
  const parsed = JSON.parse(res);
  return [...new Set(parsed.flat().map((v) => v?.toString().trim()))];
}

// Preload lookup data
const battingHand = await queryAsList("SELECT Batting_hand FROM Batting_Style");
const bowlingSkill = await queryAsList("SELECT Bowling_skill FROM Bowling_Style");
const cityName = await queryAsList("SELECT City_Name FROM City");
const teamName = await queryAsList("SELECT Team_Name FROM Team");
const venueName = await queryAsList("SELECT Venue_Name FROM Venue");
const countryName = await queryAsList("SELECT Country_Name FROM Country");
const playerName = await queryAsList("SELECT Player_Name FROM Player");

const allTextData = battingHand.concat(bowlingSkill, cityName, teamName, venueName, countryName, playerName);
const vectorDB = await FAISS.fromTexts(allTextData, new OpenAIEmbeddings({ apiKey: OPENAI_API_KEY }));
const retriever = vectorDB.asRetriever({ k: 5 });

const retrieverTool = createRetrieverTool(retriever, {
  name: "search_proper_nouns",
  description: "Use this tool to look up valid proper nouns in the database for filters.",
});

//examples
const examples = [
  {
    input: "Find the player with the highest average runs per match across multiple seasons.",
    query: "SELECT Player.Player_Name, AVG(Batsman_Scored.Runs_Scored) as Average_Runs FROM Player INNER JOIN Player_Match ON Player.Player_Id = Player_Match.Player_Id INNER JOIN Batsman_Scored ON Player_Match.Match_Id = Batsman_Scored.Match_Id GROUP BY Player.Player_Name ORDER BY Average_Runs DESC LIMIT 1;",
  },
  {
    input: "List all players who have played in more than three teams.",
    query: "SELECT Player.Player_Name FROM Player INNER JOIN Player_Match ON Player.Player_Id = Player_Match.Player_Id GROUP BY Player.Player_Name HAVING COUNT(DISTINCT Player_Match.Team_Id) > 3;",
  },
  // (You can add more examples if needed)
];

const systemPrefix = `
You are an intelligent SQL assistant for IPL statistics.
Generate valid, optimized SQL queries based on user questions.
Use only the following tables:
${tableInfo}
`;

const exampleSelector = new SemanticSimilarityExampleSelector({
  examples,
  embeddings: new OpenAIEmbeddings({ apiKey: OPENAI_API_KEY }),
  vectorStoreClass: FAISS,
  k: 5,
});

const fewShotPrompt = new FewShotPromptTemplate({
  exampleSelector,
  examplePrompt: new PromptTemplate({
    inputVariables: ["input", "query"],
    template: "User: {input}\nSQL: {query}",
  }),
  inputVariables: ["input", "dialect", "top_k"],
  prefix: systemPrefix,
  suffix: "",
});

const fullPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(fewShotPrompt),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

// agent
const agent = createSqlAgent({
  llm,
  db: sqlDB,
  extraTools: [retrieverTool],
  prompt: fullPrompt,
  verbose: true,
});

//  functions
let chatHistory = [];

async function generateSQL(userPrompt) {
  chatHistory.push({ role: "user", content: userPrompt });
  const result = await agent.invoke({ input: userPrompt });
  return result.output;
}

async function getCleanSQL(sql) {
  const completion = await llm.invoke(
    `Fix the following SQL if it contains syntax issues. Return only valid SQL:\n${sql}`
  );
  return completion.content.trim();
}

async function resolveError(sql, err) {
  const completion = await llm.invoke(
    `Rewrite this SQL to fix the following error: ${err}\nSQL: ${sql}\nReturn only valid SQL.`
  );
  return completion.content.trim();
}

function resetChat() {
  chatHistory = [];
}

export { generateSQL, resetChat, getCleanSQL, resolveError };
