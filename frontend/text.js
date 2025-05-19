

const fetchData = async () => {

    try {
        const response = await fetch('http://localhost:5000/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: "Player with top score in a single match", reset: true }),
        });
        const data = await response.json();
        console.log(data);

        
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchData();
