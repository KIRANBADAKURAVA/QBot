import Groq from "groq-sdk";
import dotenv from "dotenv";
import db from './db.js';


dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});





const IPL_SCHEMA_CONTEXT = `
You are an expert IPL stats assistant. The IPL SQLite database schema includes the following tables and columns:

Match(Match_Id, Team_1, Team_2, Match_Date, Season_Id, Venue_Id, Toss_Winner, Toss_Decide, Win_Type, Win_Margin, Outcome_Id, Match_Winner, Man_Of_The_Match),
Player(Player_Id, Player_Name, DOB, Bowling_skill,Batting_hand, Country_Name),
Player_Match(Match_Id, Player_Id, Role_Id, Team_Id),
Role(Role_Id, Role_Desc),
Team(Team_Id, Team_Name),
Ball_by_Ball(Match_Id, Over_Id, Ball_Id, Innings_No, Team_Batting, Team_Bowling, Striker_Batting_Position, Striker, Non_Striker, Bowler),
Batsman_Scored(Match_Id, Over_Id, Ball_Id, Runs_Scored, Innings_No),
Wicket_Taken(Match_Id, Over_Id, Ball_Id, Player_Out, Kind_Out, Fielders, Innings_No),
Out_Type(Out_Id, Out_Name),
Venue(Venue_Id, Venue_Name, City_Id),
City(City_Id, City_Name, Country_Id),
Country(Country_Id, Country_Name),
Toss_Decision(Toss_Id, Toss_Name),
Outcome(Outcome_Id, Outcome_Type),
Umpire(Umpire_Id, Umpire_Name, Umpire_Country),
Season(Season_Id, Season_Year),
Batting_Style(Batting_Id, Batting_hand),
Bowling_Style(Bowling_Id, Bowling_skill),
Win_By(Win_Id, Win_Type),
Extra_Type(Extra_Id, Extra_Name),
Extra_Runs(Match_Id, Over_Id, Ball_Id, Extra_Id, Extra_Runs, Innings_No)


- The table information is given in the following format:
    Table_Name(Column_1, Column_2, Column_3, ...)
    use this format to write the query

- for example in Batting_Style(Batting_Id, Batting_hand), Batting_Id is the primary key and Batting_hand is the column name





Always generalize and optimize the query to retrieve only what's asked. Always limit the response to 5 unless a number mentioned. If a query cannot be answered with the schema provided, return a SQL comment explaining why (e.g., -- Unable to answer because the table does not include required data).
Your task is to return only the correct and syntactically valid SQL query based on the user's prompt. Do not return any explanation or text. Only output a single SQL query as plain text.

the expected output is something like this: "SELECT Match_Id FROM Match WHERE Toss_Decide = (SELECT Toss_Id FROM Toss_Decision WHERE Toss_Name = 'Bat') AND Toss_Winner = Match_Winner;"
    
`;








let chatHistory = [];

async function generateSQL(userPrompt) {
   // console.log('in queryllm.js',userPrompt);
  chatHistory.push({ role: "user", content: userPrompt });

  const res = await groq.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [
      { role: "system", content: IPL_SCHEMA_CONTEXT },
      ...chatHistory,
    ],
  });

  const reply = res.choices[0].message.content.trim();
  //console.log('in regenarting sql',reply);
  return reply;
}

async function getCleanSQL(sql, error) {
    const reply = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
            {
                role: "system",
                content: `You are an expert SQL assistant. A user will give you an incorrect or invalid SQL query. Your task is to:
1. Fix any syntax or logical errors in the query related to: ${error}.
2. Only use columns and tables from the schema provided below.
3. Return only the corrected and syntactically valid SQL query. Do not include any explanations, comments, or additional text.

Schema:
Match(Match_Id, Team_1, Team_2, Match_Date, Season_Id, Venue_Id, Toss_Winner, Toss_Decide, Win_Type, Win_Margin, Outcome_Id, Match_Winner, Man_Of_The_Match),
Player(Player_Id, Player_Name, DOB, Bowling_skill, Batting_hand, Country_Name),
Player_Match(Match_Id, Player_Id, Role_Id, Team_Id),
Role(Role_Id, Role_Desc),
Team(Team_Id, Team_Name),
Ball_by_Ball(Match_Id, Over_Id, Ball_Id, Innings_No, Team_Batting, Team_Bowling, Striker_Batting_Position, Striker, Non_Striker, Bowler),
Batsman_Scored(Match_Id, Over_Id, Ball_Id, Runs_Scored, Innings_No),
Wicket_Taken(Match_Id, Over_Id, Ball_Id, Player_Out, Kind_Out, Fielders, Innings_No),
Out_Type(Out_Id, Out_Name),
Venue(Venue_Id, Venue_Name, City_Id),
City(City_Id, City_Name, Country_Id),
Country(Country_Id, Country_Name),
Toss_Decision(Toss_Id, Toss_Name),
Outcome(Outcome_Id, Outcome_Type),
Umpire(Umpire_Id, Umpire_Name, Umpire_Country),
Season(Season_Id, Season_Year),
Batting_Style(Batting_Id, Batting_hand),
Bowling_Style(Bowling_Id, Bowling_skill),
Win_By(Win_Id, Win_Type),
Extra_Type(Extra_Id, Extra_Name),
Extra_Runs(Match_Id, Over_Id, Ball_Id, Extra_Id, Extra_Runs, Innings_No)`
            },
            {
                role: "user",
                content: sql
            }
        ],
    });

    const cleanSQL = reply.choices[0].message.content.trim();
    return cleanSQL;
}


async function resolveError(sql, err) {
    const reply = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
            { role: "system", content: `Rewrite the ${sql}  . Your task is to return only the correct and syntactically valid SQL query and dont return any other text` },
            { role: "user", content: sql },
        ],
    });
    const cleanSQL= reply.choices[0].message.content.trim();
   console.log('in getcleanSQL',cleanSQL);
    return cleanSQL;
}



function resetChat() {
  chatHistory = [];
}

// const func= async()=>{
//     const cleanSQL = await generateSQL('Find the matfches with the highest aggregate score.');
//     const cleanSQL2 = await getcleanSQL(cleanSQL);

// console.log(cleanSQL2  );
// db.all(cleanSQL2, [], (err, rows) => {
//     if (err)  {
//         throw err;
//     }
//     else{
//         console.log(rows);
//     }

//   });

// }
//func();
export { generateSQL, resetChat, getCleanSQL ,resolveError };