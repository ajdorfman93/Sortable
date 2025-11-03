import Sortable from '../src/Sortable.js';
import AutoScroll from '../plugins/AutoScroll';
import { RemoveOnSpill, RevertOnSpill } from '../plugins/OnSpill';
// Extra
import Swap from '../plugins/Swap';
import MultiDrag from '../plugins/MultiDrag';
import Resize from '../plugins/Resize';

Sortable.mount(new AutoScroll());
Sortable.mount(RemoveOnSpill, RevertOnSpill);
Sortable.mount(new Resize());

export default Sortable;

export {
	Sortable,

	// Extra
	Swap,
	MultiDrag,
	Resize
};
