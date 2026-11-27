import * as React from 'react';
import { Button as MUIButton, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface Props {
	name?: string;
	icon: IconProp;
	onClick: React.MouseEventHandler;
	disabled?: boolean;
	title?: string;
	label?: string;
	// Width and height of the button in pixels (default: 26). Touch layouts
	// pass a larger size so that the buttons are easy to tap.
	size?: number;
}

export default (props: Props) => {
	const renderButton = () => {
		const isIconOnly = !props.label;
		const size = props.size ?? 26;

		return (
			<MUIButton
				disabled={!!props.disabled}
				onClick={props.onClick}
				sx={
					isIconOnly
						? {
							width: size,
							height: size,
							minWidth: size,
							maxWidth: size,
							minHeight: size,
							maxHeight: size,
						}
						: {
							px: 1.5,
							minHeight: size,
							height: size,
						}
				}
			>
				<FontAwesomeIcon icon={props.icon} style={{ marginRight: props.label ? 6 : 0 }} />
				{props.label && <span style={{ textTransform: 'lowercase' }}>{props.label}</span>}
			</MUIButton>
		);
	};

	if (!props.disabled) {
		return (
			<Tooltip hidden={!props.title} title={props.title}>
				{renderButton()}
			</Tooltip>
		);
	} else {
		return renderButton();
	}
}
