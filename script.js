document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const currentDateElement = document.getElementById('current-date');
    const wordElement = document.getElementById('word');
    const ipaElement = document.getElementById('ipa');
    const definitionsElement = document.getElementById('definitions');
    const loadingElement = document.getElementById('loading');
    const wordContentElement = document.getElementById('word-content');
    const errorElement = document.getElementById('error');
    const shareButton = document.getElementById('share-btn');
    const listenButton = document.getElementById('listen-btn');
    
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
    listenButton.addEventListener('click', speakWord);
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
            
            // Use the seed to select a word ID between 1 and TOTAL_WORDS
            // This ensures the same word is shown all day, but changes each day
            const wordId = Math.abs(seed % TOTAL_WORDS) + 1;
            
            // Fetch the specific word by its ID
            const response = await fetch(`${API_BASE_URL}/api/v1/words/${wordId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch word of the day');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching word of the day:', error);
            console.log('Using fallback word...');
            return getFallbackWord();
        }
    }
    
    /**
     * Displays the word, pronunciation, and definitions on the page
     */
    function displayWord(word) {
        // Hide loading and show content
        loadingElement.style.display = 'none';
        wordContentElement.style.display = 'block';
        
        // Display the word
        wordElement.textContent = word.word;
        
        // Display pronunciation if available
        if (word.ipa) {
            ipaElement.textContent = word.ipa;
        } else if (word.ipa_alt) {
            ipaElement.textContent = word.ipa_alt;
        } else {
            ipaElement.textContent = '';
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
            
            const exampleLabel = document.createElement('p');
            exampleLabel.className = 'example-label';
            exampleLabel.textContent = 'Example:';
            
            const exampleText = document.createElement('p');
            exampleText.className = 'example-text';
            exampleText.textContent = word.example;
            
            exampleContainer.appendChild(exampleLabel);
            exampleContainer.appendChild(exampleText);
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
     * Speaks the IPA pronunciation using the Web Speech API
     */
    function speakWord() {
        // Get the IPA pronunciation
        const ipaText = ipaElement.textContent.slice(1, -1); // Remove slashes
        
        // Check if there's an IPA pronunciation and if speech synthesis is supported
        if (ipaText && 'speechSynthesis' in window) {
            // Create a new speech synthesis utterance
            const utterance = new SpeechSynthesisUtterance(ipaText);
            
            // Set the language to English for better IPA pronunciation
            utterance.lang = 'en-US';
            
            // Set a slower rate for better pronunciation
            utterance.rate = 0.7;
            
            // Add visual feedback when speaking
            listenButton.classList.add('speaking');
            
            // Add an event listener for when speech has finished
            utterance.onend = () => {
                listenButton.classList.remove('speaking');
            };
            
            // Speak the IPA pronunciation
            window.speechSynthesis.speak(utterance);
        } else if (!ipaText) {
            // No IPA pronunciation available
            alert('Sorry, no pronunciation is available for this word.');
        } else {
            // Speech synthesis not supported
            alert('Sorry, your browser does not support text-to-speech functionality.');
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
            
            // Generate a random word ID between 1 and TOTAL_WORDS
            const randomWordId = Math.floor(Math.random() * TOTAL_WORDS) + 1;
            
            // Fetch the specific word by its ID
            const response = await fetch(`${API_BASE_URL}/api/v1/words/${randomWordId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch random word');
            }
            
            const randomWord = await response.json();
            
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
                word: "નમસ્તે",
                ipa: "/nəməste/",
                definitions: [
                    { pos: "interjection", definition: "Hello; Greetings (a common greeting)" }
                ],
                example: "તમને મળીને આનંદ થયો, નમસ્તે!"
            },
            {
                word: "આભાર",
                ipa: "/ābhār/",
                definitions: [
                    { pos: "noun", definition: "Thanks; Gratitude" }
                ],
                example: "તમારી મદદ બદલ આભાર."
            },
            {
                word: "પ્રેમ",
                ipa: "/prem/",
                definitions: [
                    { pos: "noun", definition: "Love; Affection" }
                ],
                example: "માતાનો પ્રેમ સૌથી મહાન છે."
            }
        ];
        
        // Use the date to select a consistent fallback word
        const dateString = formatDateForSeed(today);
        const seed = hashCode(dateString);
        const index = Math.abs(seed % fallbackWords.length);
        
        return fallbackWords[index];
    }
});
