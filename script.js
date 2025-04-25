document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const currentDateElement = document.getElementById('current-date');
    const wordElement = document.getElementById('word');
    const romanizationElement = document.getElementById('romanization');
    const definitionsElement = document.getElementById('definitions');
    const loadingElement = document.getElementById('loading');
    const wordContentElement = document.getElementById('word-content');
    const errorElement = document.getElementById('error');
    const shareButton = document.getElementById('share-btn');
    const listenWordButton = document.getElementById('listen-word-btn');
    
    // API endpoint
    const API_BASE_URL = 'https://gujarati.shivvtrivedi.com';
    
    // Display current date
    const today = new Date();
    currentDateElement.textContent = formatDate(today);
    
    // Get word of the day
    getWordOfTheDay()
        .then(displayWord)
        .catch(handleError);
    
    // Set up buttons
    shareButton.addEventListener('click', shareWord);
    listenWordButton.addEventListener('click', playWordAudio);
    const newWordButton = document.getElementById('new-word-btn');
    newWordButton.addEventListener('click', getRandomWord);
    
    /**
     * Fetches the word of the day based on the current date
     */
    async function getWordOfTheDay() {
        try {
            // Use the current date as a seed to consistently get the same word each day
            const dateString = formatDateForSeed(today);
            const seed = hashCode(dateString);
            
            // Total number of words in the API
            const TOTAL_WORDS = 6776;
            // const TOTAL_WORDS = 4000;

            // Use the seed to select a word ID between 1 and TOTAL_WORDS
            // This ensures the same word is shown all day, but changes each day
            const wordId = Math.abs(seed % TOTAL_WORDS) + 1;
            // console.log('Fetching word with ID:', wordId);
            
            // Fetch the specific word by its ID
            const apiUrl = `${API_BASE_URL}/api/v1/words/${wordId}`;
            // console.log('API URL:', apiUrl);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error('Failed to fetch word of the day');
            }
            
            const wordData = await response.json();
            
            // Store the numeric ID in the response for audio playback
            wordData.numeric_id = wordId;
            
            return wordData;
        } catch (error) {
            console.error('Error fetching word of the day:', error);
            // console.log('Using fallback word...');
            return getFallbackWord();
        }
    }
    
    /**
     * Displays the word, romanization, and definitions on the page
     */
    function displayWord(word) {
        // Hide loading and show content
        loadingElement.style.display = 'none';
        wordContentElement.style.display = 'block';
        
        // Log the word data for debugging
        // console.log('Word data:', word);
        
        // Display the word
        wordElement.textContent = word.word;
        
        // Store the current word ID for audio playback
        // Use the numeric_id we added, or try to extract it from other properties
        let wordId = '';
        
        // First priority: use the numeric_id we added when fetching the word
        if (word.numeric_id) {
            wordId = word.numeric_id;
        } 
        // Second priority: use id or _id if available
        else if (word.id) {
            wordId = word.id;
        } else if (word._id) {
            wordId = word._id;
        } 
        // Third priority: try to extract the ID from the URL if available
        else {
            const wordUrl = word.url || '';
            const urlMatch = wordUrl.match(/\/words\/(\d+)/);
            if (urlMatch && urlMatch[1]) {
                wordId = urlMatch[1];
            } 
            // Last resort: use the word itself
            else {
                wordId = word.word || '';
            }
        }
        
        wordElement.dataset.wordId = wordId;
        // console.log('Setting word ID for audio:', wordId);
        
        // Display romanization if available
        if (word.romanization) {
            romanizationElement.textContent = word.romanization;
        } else {
            romanizationElement.textContent = '';
        }
        
        // Display definitions
        definitionsElement.innerHTML = '';
        word.definitions.forEach(def => {
            const definitionItem = document.createElement('div');
            definitionItem.className = 'definition-item';
            
            const pos = document.createElement('p');
            pos.className = 'pos';
            pos.textContent = def.pos;
            
            const definition = document.createElement('p');
            definition.className = 'definition-text';
            definition.textContent = def.definition;
            
            definitionItem.appendChild(pos);
            definitionItem.appendChild(definition);
            definitionsElement.appendChild(definitionItem);
        });
        
        // Display example sentence if available
        if (word.example) {
            const exampleContainer = document.createElement('div');
            exampleContainer.className = 'example-container';
            
            const exampleHeader = document.createElement('div');
            exampleHeader.className = 'example-header';
            
            const exampleLabel = document.createElement('p');
            exampleLabel.className = 'example-label';
            exampleLabel.textContent = 'Example:';
            
            // Create listen button for example
            const listenExampleBtn = document.createElement('button');
            listenExampleBtn.id = 'listen-example-btn';
            listenExampleBtn.className = 'listen-btn';
            listenExampleBtn.title = 'Listen to example';
            listenExampleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
            `;
            
            // Add event listener to play example audio
            listenExampleBtn.addEventListener('click', playExampleAudio);
            
            exampleHeader.appendChild(exampleLabel);
            exampleHeader.appendChild(listenExampleBtn);
            
            const exampleText = document.createElement('p');
            exampleText.className = 'example-text';
            exampleText.textContent = word.example;
            
            exampleContainer.appendChild(exampleHeader);
            exampleContainer.appendChild(exampleText);
            
            // Add example romanization if available
            if (word.example_romanization) {
                const exampleRomanization = document.createElement('p');
                exampleRomanization.className = 'example-romanization';
                exampleRomanization.textContent = word.example_romanization;
                exampleContainer.appendChild(exampleRomanization);
            }
            
            // Add example translation if available
            if (word.example_translation) {
                const exampleTranslation = document.createElement('p');
                exampleTranslation.className = 'example-translation';
                exampleTranslation.textContent = word.example_translation;
                exampleContainer.appendChild(exampleTranslation);
            }
            
            definitionsElement.appendChild(exampleContainer);
        }
    }
    
    /**
     * Handles errors when fetching or displaying the word
     */
    function handleError(error) {
        console.error('Error:', error);
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
    }
    
    /**
     * Formats the date for display (e.g., "Wednesday, April 23, 2025")
     */
    function formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }
    
    /**
     * Formats the date as a string for seed generation (YYYY-MM-DD)
     */
    function formatDateForSeed(date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
    
    /**
     * Simple hash function to convert a string to a number
     */
    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
    
    /**
     * Shares the current word via the Web Share API or fallback
     */
    function shareWord() {
        const wordText = wordElement.textContent;
        let shareText = `Today's Gujarati Word of the Day: ${wordText}`;
        
        // Check if there's an example sentence to include
        const exampleElement = document.querySelector('.example-text');
        if (exampleElement) {
            shareText += `\nExample: ${exampleElement.textContent}`;
        }
        
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'Gujarati Word of the Day',
                text: shareText,
                url: shareUrl
            })
            .catch(error => console.error('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support the Web Share API
            prompt('Copy this link to share:', `${shareText}\n${shareUrl}`);
        }
    }
    
    /**
     * Plays the audio for the current word
     */
    async function playWordAudio() {
        try {
            const wordId = wordElement.dataset.wordId;
            // console.log('Word ID for audio:', wordId);
            
            if (!wordId) {
                alert('Sorry, audio is not available for this word.');
                return;
            }
            
            // Add visual feedback when playing
            listenWordButton.classList.add('speaking');
            
            // Create the audio URL
            const audioUrl = `${API_BASE_URL}/api/v1/audio/word/${wordId}`;
            // console.log('Audio URL:', audioUrl);
            
            // Create and play audio
            const audio = new Audio(audioUrl);
            
            // Add event listener for when audio has finished
            audio.onended = () => {
                listenWordButton.classList.remove('speaking');
            };
            
            // Handle errors
            audio.onerror = (e) => {
                console.error('Audio error:', e);
                listenWordButton.classList.remove('speaking');
                alert('Sorry, there was an error playing the audio.');
            };
            
            // Play the audio
            await audio.play();
            
        } catch (error) {
            console.error('Error playing word audio:', error);
            listenWordButton.classList.remove('speaking');
            alert('Sorry, there was an error playing the audio.');
        }
    }
    
    /**
     * Plays the audio for the example sentence
     */
    async function playExampleAudio() {
        try {
            const wordId = wordElement.dataset.wordId;
            const listenExampleButton = document.getElementById('listen-example-btn');
            // console.log('Word ID for example audio:', wordId);
            
            if (!wordId || !listenExampleButton) {
                alert('Sorry, audio is not available for this example.');
                return;
            }
            
            // Add visual feedback when playing
            listenExampleButton.classList.add('speaking');
            
            // Create the audio URL
            const audioUrl = `${API_BASE_URL}/api/v1/audio/example/${wordId}`;
            // console.log('Example Audio URL:', audioUrl);
            
            // Create and play audio
            const audio = new Audio(audioUrl);
            
            // Add event listener for when audio has finished
            audio.onended = () => {
                listenExampleButton.classList.remove('speaking');
            };
            
            // Handle errors
            audio.onerror = (e) => {
                console.error('Example audio error:', e);
                listenExampleButton.classList.remove('speaking');
                alert('Sorry, there was an error playing the audio.');
            };
            
            // Play the audio
            await audio.play();
            
        } catch (error) {
            console.error('Error playing example audio:', error);
            const listenExampleButton = document.getElementById('listen-example-btn');
            if (listenExampleButton) {
                listenExampleButton.classList.remove('speaking');
            }
            alert('Sorry, there was an error playing the audio.');
        }
    }
    
    /**
     * Fetches a random word from the API
     */
    async function getRandomWord() {
        try {
            // Show loading state
            wordContentElement.style.display = 'none';
            errorElement.style.display = 'none';
            loadingElement.style.display = 'flex';
            loadingElement.querySelector('p').textContent = 'Loading new word...';
            
            // Total number of words in the API
            const TOTAL_WORDS = 6776;
            // const TOTAL_WORDS = 4000;
            
            // Generate a random word ID between 1 and TOTAL_WORDS
            const randomWordId = Math.floor(Math.random() * TOTAL_WORDS) + 1;
            // console.log('Fetching random word with ID:', randomWordId);
            
            // Fetch the specific word by its ID
            const apiUrl = `${API_BASE_URL}/api/v1/words/${randomWordId}`;
            // console.log('Random word API URL:', apiUrl);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error('Failed to fetch random word');
            }
            
            const randomWord = await response.json();
            
            // Store the numeric ID in the response for audio playback
            randomWord.numeric_id = randomWordId;
            
            // Display the random word
            displayWord(randomWord);
        } catch (error) {
            console.error('Error fetching random word:', error);
            handleError(error);
        }
    }
    
    /**
     * Fallback function to fetch a random word if the API fails
     * This ensures the page still works even if there are API issues
     */
    async function getFallbackWord() {
        // Sample fallback words
        const fallbackWords = [
            {
                id: "fallback1",
                numeric_id: 1,
                word: "નમસ્તે",
                romanization: "namaste",
                definitions: [
                    { pos: "interjection", definition: "Hello; Greetings (a common greeting)" }
                ],
                example: "તમને મળીને આનંદ થયો, નમસ્તે!",
                example_romanization: "tamane maḷīne ānanda thayo, namaste!",
                example_translation: "I am happy to meet you, hello!"
            },
            {
                id: "fallback2",
                numeric_id: 2,
                word: "આભાર",
                romanization: "ābhār",
                definitions: [
                    { pos: "noun", definition: "Thanks; Gratitude" }
                ],
                example: "તમારી મદદ બદલ આભાર.",
                example_romanization: "tamārī madada badala ābhāra.",
                example_translation: "Thanks for your help."
            },
            {
                id: "fallback3",
                numeric_id: 3,
                word: "પ્રેમ",
                romanization: "prem",
                definitions: [
                    { pos: "noun", definition: "Love; Affection" }
                ],
                example: "માતાનો પ્રેમ સૌથી મહાન છે.",
                example_romanization: "mātāno prema sauthī mahāna che.",
                example_translation: "A mother's love is the greatest."
            }
        ];
        
        // Use the date to select a consistent fallback word
        const dateString = formatDateForSeed(today);
        const seed = hashCode(dateString);
        const index = Math.abs(seed % fallbackWords.length);
        
        return fallbackWords[index];
    }
});
