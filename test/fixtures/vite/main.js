// The fixture's script: two icons imported by module, as a component imports them, so its build
// carries exactly their markup and no other icon's.

import gear from "@standards-lab/web-icons/octicon/gear-16";
import x from "@standards-lab/web-icons/octicon/x-16";

document.querySelector("main").innerHTML = gear + x;
