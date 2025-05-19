import Groq from "groq-sdk";
import dotenv from "dotenv";
import db from './db.js';


dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const examples = [
    {
        "input": "Find the player with the highest average runs per match across multiple seasons.",
        "query": "SELECT Player.Player_Name, AVG(Batsman_Scored.Runs_Scored) as Average_Runs FROM Player INNER JOIN Player_Match ON Player.Player_Id = Player_Match.Player_Id INNER JOIN Batsman_Scored ON Player_Match.Match_Id = Batsman_Scored.Match_Id AND Player.Player_Id = Player_Match.Player_Id GROUP BY Player.Player_Name ORDER BY Average_Runs DESC LIMIT 1;"
    },
    {
        "input": "List all players who have played in more than three teams throughout their career.",
        "query": "SELECT Player.Player_Name FROM Player INNER JOIN Player_Match ON Player.Player_Id = Player_Match.Player_Id GROUP BY Player.Player_Name HAVING COUNT(DISTINCT Player_Match.Team_Id) > 3;"
    },
    {
        "input": "Find the match with the most extra runs scored.",
        "query": "SELECT Match_Id, SUM(Extra_Runs) as Total_Extra_Runs FROM Extra_Runs GROUP BY Match_Id ORDER BY Total_Extra_Runs DESC LIMIT 1;"
    },
    {
        "input": "Identify matches where the 'Man of the Match' scored more than 50 runs and took at least 3 wickets.",
        "query": "SELECT Match.Match_Id FROM Match INNER JOIN Batsman_Scored ON Match.Match_Id = Batsman_Scored.Match_Id INNER JOIN Wicket_Taken ON Match.Match_Id = Wicket_Taken.Match_Id WHERE Match.Man_of_the_Match IN (SELECT Player_Id FROM Player_Match WHERE Player_Id IN (SELECT Player_Id FROM Batsman_Scored WHERE Runs_Scored > 50)) AND Wicket_Taken.Player_Out IN (SELECT Player_Id FROM Player_Match WHERE Player_Id = Match.Man_of_the_Match) GROUP BY Match.Match_Id HAVING COUNT(Wicket_Taken.Player_Out) >= 3;"
    },
    {
        "input": "Calculate the total number of matches played by each player, considering both batting and bowling.",
        "query": "SELECT Player.Player_Name, COUNT(DISTINCT Player_Match.Match_Id) as Total_Matches FROM Player INNER JOIN Player_Match ON Player.Player_Id = Player_Match.Player_Id GROUP BY Player.Player_Name;"
    },
    {
        "input": "Find the teams that have won at least one match in every season.",
        "query": "SELECT Team.Team_Name FROM Team WHERE Team.Team_Id IN (SELECT Match.Match_Winner FROM Match GROUP BY Match.Season_Id, Match.Match_Winner HAVING COUNT(*) >= 1);"
    },
    {
        "input": "Find the most common bowling skill among players who have taken at least 100 wickets.",
        "query": "SELECT Bowling_Style.Bowling_skill, COUNT(*) as Frequency FROM Player INNER JOIN Bowling_Style ON Player.Bowling_skill = Bowling_Style.Bowling_Id INNER JOIN Wicket_Taken ON Player.Player_Id = Wicket_Taken.Player_Out GROUP BY Bowling_Style.Bowling_skill HAVING COUNT(*) >= 100 ORDER BY Frequency DESC LIMIT 1;"
    },
    {
        "input": "List all matches where the toss decision was to bat first, and the team that won the toss also won the match.",
        "query": "SELECT Match_Id FROM Match WHERE Toss_Decide = (SELECT Toss_Id FROM Toss_Decision WHERE Toss_Name = 'Bat') AND Toss_Winner = Match_Winner;"
    },
    {
        "input": "Find the city which has hosted the most number of matches.",
        "query": "SELECT City.City_Name, COUNT(Match.Match_Id) as Total_Matches FROM City INNER JOIN Venue ON City.City_Id = Venue.City_Id INNER JOIN Match ON Venue.Venue_Id = Match.Venue_Id GROUP BY City.City_Name ORDER BY Total_Matches DESC LIMIT 1;"
    },
    {
        "input": "Identify players who have both 'Right-hand bat' batting style and 'Right-arm fast' bowling skill.",
        "query": "SELECT Player.Player_Name FROM Player INNER JOIN Batting_Style ON Player.Batting_hand = Batting_Style.Batting_Id INNER JOIN Bowling_Style ON Player.Bowling_skill = Bowling_Style.Bowling_Id WHERE Batting_Style.Batting_hand = 'Right-hand bat' AND Bowling_Style.Bowling_skill = 'Right-arm fast';"
    },
    {
        "input": "Find the player with the highest strike rate in a season.",
        "query": "SELECT Player.Player_Name, (SUM(Batsman_Scored.Runs_Scored) * 100.0 / COUNT(*)) as Strike_Rate FROM Player INNER JOIN Player_Match ON Player.Player_Id = Player_Match.Player_Id INNER JOIN Batsman_Scored ON Player_Match.Match_Id = Batsman_Scored.Match_Id AND Player.Player_Id = Player_Match.Player_Id WHERE Season_Id = 2022 GROUP BY Player.Player_Name ORDER BY Strike_Rate DESC LIMIT 1;"
    },
    {
        "input": "Find matches where the winning margin was the closest.",
        "query": "SELECT Match_Id, Win_Type, MIN(Win_Margin) as Closest_Win_Margin FROM Match WHERE Win_Margin IS NOT NULL GROUP BY Win_Type;"
    },
    {
        "input": "Find the total runs scored by 'Virat Kohli' against 'Mumbai Indians' across all matches.",
        "query": "SELECT SUM(Batsman_Scored.Runs_Scored) as Total_Runs FROM Batsman_Scored INNER JOIN Player_Match ON Batsman_Scored.Match_Id = Player_Match.Match_Id INNER JOIN Player ON Player_Match.Player_Id = Player.Player_Id INNER JOIN Match ON Batsman_Scored.Match_Id = Match.Match_Id WHERE Player.Player_Name = 'Virat Kohli' AND (Match.Team_1 = (SELECT Team_Id FROM Team WHERE Team_Name = 'Mumbai Indians') OR Match.Team_2 = (SELECT Team_Id FROM Team WHERE Team_Name = 'Mumbai Indians'));"
    },
    {
        "input": "Find players who have both batted and bowled in at least 50 matches.",
        "query": "SELECT Player.Player_Name FROM Player INNER JOIN Player_Match ON Player.Player_Id = Player_Match.Player_Id GROUP BY Player.Player_Name HAVING COUNT(DISTINCT Player_Match.Match_Id) >= 50;"
    },
    {
        "input": "Find matches where a player scored a century and took at least 4 wickets.",
        "query": "SELECT Match.Match_Id FROM Match INNER JOIN Player_Match ON Match.Match_Id = Player_Match.Match_Id INNER JOIN Batsman_Scored ON Player_Match.Match_Id = Batsman_Scored.Match_Id INNER JOIN Wicket_Taken ON Player_Match.Match_Id = Wicket_Taken.Match_Id WHERE Batsman_Scored.Runs_Scored >= 100 AND Wicket_Taken.Player_Out = Player_Match.Player_Id GROUP BY Match.Match_Id HAVING COUNT(Wicket_Taken.Player_Out) >= 4;"
    },
    {
        "input": "Find the highest partnership for each team in each match.",
        "query": "SELECT Match_Id, Team_Batting, MAX(Runs_Scored) as Highest_Partnership FROM (SELECT Match_Id, Team_Batting, SUM(Runs_Scored) as Runs_Scored FROM Ball_by_Ball GROUP BY Match_Id, Team_Batting, Striker, Non_Striker) GROUP BY Match_Id, Team_Batting;"
    },
    {
        "input": "Find the player with the most 'Man of the Series' awards.",
        "query": "SELECT Player.Player_Name, COUNT(*) as Awards FROM Player INNER JOIN Season ON Player.Player_Id = Season.Man_of_the_Series GROUP BY Player.Player_Name ORDER BY Awards DESC LIMIT 1;"
    },
    {
        "input": "Find players who have been part of a match-winning team at least 10 times.",
        "query": "SELECT Player.Player_Name FROM Player INNER JOIN Player_Match ON Player.Player_Id = Player_Match.Player_Id INNER JOIN Match ON Player_Match.Match_Id = Match.Match_Id WHERE Player_Match.Team_Id = Match.Match_Winner GROUP BY Player.Player_Name HAVING COUNT(*) >= 10;"
    },
    {
        "input": "Find the player with the most ducks in their career.",
        "query": "SELECT Player.Player_Name, COUNT(*) as Ducks FROM Player INNER JOIN Player_Match ON Player.Player_Id = Player_Match.Player_Id INNER JOIN Batsman_Scored ON Player_Match.Match_Id = Batsman_Scored.Match_Id WHERE Batsman_Scored.Runs_Scored = 0 GROUP BY Player.Player_Name ORDER BY Ducks DESC LIMIT 1;"
    },
    {
        "input": "Find the matches with the highest aggregate score.",
        "query": "SELECT Match_Id, SUM(Runs_Scored) as Total_Runs FROM Batsman_Scored GROUP BY Match_Id ORDER BY Total_Runs DESC LIMIT 10;"
    }
 
];



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