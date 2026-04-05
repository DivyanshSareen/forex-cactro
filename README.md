# Deployment Link
Frotnend- https://forex-cactro-ujip.vercel.app/
Backend- https://forex-cactro.onrender.com

Note- I added these links 20 minutes past due time.
Note- please refer .kiro/design.md for implementation details.

# Approach
## Issue
Clients don’t trust the service enough to opt for a paid plan. On our free tier, we need to atleast match what google shows.
Solution
## PM’s Input
Provide them an illusion of accuracy to free users by providing them with better results over critical times. Ex. during their peak hours, initial duration of their registration or when the user is showing high intent.
## Set Limitation
We can give each user $5/day worth of premium calls i.e. 5,000 accurate responses.
## Possible Implementation
Utilise every premium call made through our backend. A caching layer to save results of any call to the Premium API. It can be either from a paid or free user. For now we can set the expiration time to 5 minutes.
A machine learning model to score the intent of the user to convert to a paid plan based on data points like api call usage, feedback etc. For now, intent can be scored manually by the sales rep.
Identify peak timings for API usage. Conduct EDA on the free tier user base to find peak timings for each user. For now this can be asked directly to the users by the sales rep.
For free tier calls, keep a backup of several free tier APIs. Come up with a load balancing strategy based on the quality and quantity of requests each free API has to offer. 
Cache the free tier results but keep the expiration lower than premium API entries. You may override a free tier result in the cache with an updated premium call result. Also, update the rates in an async manner. Return the rates to the user first. 
Use premium API if all calls fail. Mark this event if you had to go beyond the premium call budget.
